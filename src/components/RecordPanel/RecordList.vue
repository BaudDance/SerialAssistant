<script setup>
import { useVirtualizer } from '@tanstack/vue-virtual'
import dayjs from 'dayjs'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'

const props = defineProps({
  sessionId: {
    type: String,
    default: undefined,
  },
  count: {
    type: Number,
    default: undefined,
  },
  emptyText: {
    type: String,
    default: '暂无记录',
  },
  stickToBottom: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:stickToBottom'])

const BOTTOM_THRESHOLD_PX = 24
const USER_SCROLL_LOCK_DELTA_PX = 2
const BOTTOM_PADDING_PX = 48
const BOTTOM_RESTORE_THRESHOLD_PX = BOTTOM_PADDING_PX + BOTTOM_THRESHOLD_PX
const TAIL_PREFETCH_MIN_ROWS = 40
const FOLLOW_SLOW_DURATION_MS = 140
const FOLLOW_FAST_DURATION_MS = 80
const FOLLOW_RECENT_INTERVAL_MS = 180
const FOLLOW_MID_ADDED_COUNT = 3
const FOLLOW_HIGH_ADDED_COUNT = 8
const FOLLOW_FAR_DISTANCE_RATIO = 0.5
const ENTERING_ROW_TTL_MS = 220
const ENTERING_ROW_LIMIT = 12
const PROGRAMMATIC_SCROLL_IGNORE_MS = 160

const { fetchRecordRows, setRecordDisplay, copyRecordContent, recordCount } = useRecordStore()
const { recordTypes } = useSerialStore()

const rootEl = ref(null)
const rowsByIndex = ref({})
const enteringRowIndexes = ref(new Set())
const showFullDate = ref(false)
const refreshKey = ref(0)
let loadToken = 0
let lastScrollTop = 0
let ignoreScrollUntil = 0
let previousCount = 0
let lastReceiveAt = 0
let bottomScrollFrameId = 0
let pendingBottomRequest = null
let followScrollFrameId = 0
let followScrollStartAt = 0
let followScrollStartOffset = 0
let followScrollTargetOffset = 0
let followScrollDuration = FOLLOW_SLOW_DURATION_MS
let enteringCleanupTimer = 0

const totalCount = computed(() => props.count ?? recordCount.value)
const isLiveList = computed(() => props.sessionId === undefined && props.count === undefined)
const rowVirtualizer = useVirtualizer(computed(() => ({
  count: totalCount.value,
  getScrollElement: () => rootEl.value,
  estimateSize: () => 96,
  paddingEnd: BOTTOM_PADDING_PX,
  scrollPaddingEnd: BOTTOM_PADDING_PX,
  overscan: 10,
})))

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

function formatTime(time) {
  return showFullDate.value
    ? dayjs(time).format('YYYY-MM-DD HH:mm:ss:SSS')
    : dayjs(time).format('HH:mm:ss:SSS')
}

function formatRecordTime(record) {
  if (record.firstSeenAt && record.lastSeenAt && record.lastSeenAt !== record.firstSeenAt)
    return `${formatTime(record.firstSeenAt)} ~ ${formatTime(record.lastSeenAt)}`
  return formatTime(record.time)
}

function toggleTimeFormat() {
  showFullDate.value = !showFullDate.value
}

function measureElement(el) {
  if (el)
    rowVirtualizer.value.measureElement(el)
}

function measureVisibleElements() {
  rootEl.value
    ?.querySelectorAll('[data-index]')
    .forEach(el => rowVirtualizer.value.measureElement(el))
}

function requestFrame(callback) {
  return typeof window === 'undefined'
    ? setTimeout(() => callback(now()), 16)
    : window.requestAnimationFrame(callback)
}

function cancelFrame(id) {
  if (!id)
    return
  if (typeof window === 'undefined')
    clearTimeout(id)
  else
    window.cancelAnimationFrame(id)
}

function now() {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function isNearBottom() {
  const el = rootEl.value
  if (!el)
    return true

  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distanceToBottom <= BOTTOM_RESTORE_THRESHOLD_PX)
    return true

  const lastRow = virtualRows.value.find(row => row.index === totalCount.value - 1)
  if (!lastRow)
    return false

  return lastRow.end <= el.scrollTop + el.clientHeight + BOTTOM_THRESHOLD_PX
}

function emitStickToBottom(value) {
  if (props.stickToBottom !== value)
    emit('update:stickToBottom', value)
}

function markProgrammaticScroll() {
  ignoreScrollUntil = now() + PROGRAMMATIC_SCROLL_IGNORE_MS
}

function getBottomOffset() {
  const el = rootEl.value
  if (!el)
    return 0
  return Math.max(0, el.scrollHeight - el.clientHeight)
}

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

function cancelFollowScroll() {
  if (!followScrollFrameId)
    return

  cancelFrame(followScrollFrameId)
  followScrollFrameId = 0
}

function jumpToBottom() {
  if (totalCount.value <= 0)
    return

  const el = rootEl.value
  if (!el)
    return

  markProgrammaticScroll()
  rowVirtualizer.value.scrollToIndex(totalCount.value - 1, { align: 'end', behavior: 'auto' })
  el.scrollTop = getBottomOffset()
  lastScrollTop = el.scrollTop
}

function getFollowDuration({ addedCount, receiveInterval }) {
  if (addedCount >= FOLLOW_MID_ADDED_COUNT || receiveInterval <= FOLLOW_RECENT_INTERVAL_MS)
    return FOLLOW_FAST_DURATION_MS
  return FOLLOW_SLOW_DURATION_MS
}

function startFollowScroll({ addedCount = 1, receiveInterval = Number.POSITIVE_INFINITY, duration } = {}) {
  if (totalCount.value <= 0)
    return

  const el = rootEl.value
  if (!el)
    return

  const targetOffset = getBottomOffset()
  const distance = Math.abs(targetOffset - el.scrollTop)
  if (distance <= 1)
    return

  if (
    prefersReducedMotion()
    || addedCount > FOLLOW_HIGH_ADDED_COUNT
    || distance > el.clientHeight * FOLLOW_FAR_DISTANCE_RATIO
  ) {
    cancelFollowScroll()
    jumpToBottom()
    return
  }

  markProgrammaticScroll()
  followScrollStartAt = now()
  followScrollStartOffset = el.scrollTop
  followScrollTargetOffset = targetOffset
  followScrollDuration = duration || getFollowDuration({ addedCount, receiveInterval })

  if (followScrollFrameId)
    return

  function step() {
    const el = rootEl.value
    if (!el) {
      followScrollFrameId = 0
      return
    }

    markProgrammaticScroll()
    const elapsed = now() - followScrollStartAt
    const progress = Math.min(1, elapsed / followScrollDuration)
    const eased = easeOutCubic(progress)
    el.scrollTop = followScrollStartOffset + (followScrollTargetOffset - followScrollStartOffset) * eased
    lastScrollTop = el.scrollTop

    if (progress < 1 && Math.abs(followScrollTargetOffset - el.scrollTop) > 1) {
      followScrollFrameId = requestFrame(step)
      return
    }

    el.scrollTop = followScrollTargetOffset
    lastScrollTop = el.scrollTop
    followScrollFrameId = 0
  }

  followScrollFrameId = requestFrame(step)
}

function performScrollToBottom(behavior = 'follow', options = {}) {
  if (behavior === 'auto') {
    cancelFollowScroll()
    jumpToBottom()
    return
  }

  startFollowScroll({
    ...options,
    duration: behavior === 'smooth' ? FOLLOW_SLOW_DURATION_MS : options.duration,
  })
}

function scheduleScrollToBottom(behavior = 'follow', options = {}) {
  if (!bottomScrollFrameId) {
    pendingBottomRequest = { behavior, options }
  }
  else if (behavior === 'auto') {
    pendingBottomRequest = { behavior, options }
  }
  else if (pendingBottomRequest) {
    pendingBottomRequest = {
      behavior,
      options: {
        ...pendingBottomRequest.options,
        ...options,
      },
    }
  }

  if (bottomScrollFrameId)
    return

  bottomScrollFrameId = requestFrame(() => {
    bottomScrollFrameId = 0
    const request = pendingBottomRequest || { behavior: 'follow', options: {} }
    pendingBottomRequest = null
    performScrollToBottom(request.behavior, request.options)
  })
}

function clearEnteringRows() {
  if (enteringCleanupTimer) {
    clearTimeout(enteringCleanupTimer)
    enteringCleanupTimer = 0
  }
  enteringRowIndexes.value = new Set()
}

function markEnteringRows(startIndex, endIndex) {
  if (!isLiveList.value || prefersReducedMotion() || startIndex >= endIndex)
    return

  const from = Math.max(startIndex, endIndex - ENTERING_ROW_LIMIT)
  const next = new Set(enteringRowIndexes.value)
  for (let index = from; index < endIndex; index += 1)
    next.add(index)
  enteringRowIndexes.value = next

  if (enteringCleanupTimer)
    clearTimeout(enteringCleanupTimer)
  enteringCleanupTimer = setTimeout(() => {
    enteringCleanupTimer = 0
    enteringRowIndexes.value = new Set()
  }, ENTERING_ROW_TTL_MS)
}

function isEnteringRow(index) {
  return enteringRowIndexes.value.has(index)
}

function getFetchRange(preferBottom = false) {
  if (totalCount.value === 0)
    return undefined

  if (preferBottom) {
    const rowCount = Math.max(TAIL_PREFETCH_MIN_ROWS, virtualRows.value.length + 20)
    return {
      start: Math.max(0, totalCount.value - rowCount),
      end: totalCount.value,
    }
  }

  const rows = virtualRows.value
  if (!rows.length)
    return undefined

  return {
    start: Math.max(0, rows[0].index - 10),
    end: Math.min(totalCount.value, rows[rows.length - 1].index + 11),
  }
}

async function loadVisibleRows({
  preferBottom = false,
  behavior,
  forceStick = false,
  addedCount = 0,
  receiveInterval = Number.POSITIVE_INFINITY,
  enteringStartIndex,
} = {}) {
  const token = ++loadToken
  const shouldStick = preferBottom && (props.stickToBottom || forceStick)

  const range = getFetchRange(preferBottom)
  if (!range) {
    rowsByIndex.value = {}
    return
  }

  const result = await fetchRecordRows(range.start, range.end, props.sessionId)
  if (token !== loadToken)
    return

  rowsByIndex.value = Object.fromEntries(result.map(row => [row.index, row]))
  if (typeof enteringStartIndex === 'number')
    markEnteringRows(enteringStartIndex, totalCount.value)

  await nextTick()
  measureVisibleElements()

  if (shouldStick && token === loadToken) {
    await nextTick()
    measureVisibleElements()
    scheduleScrollToBottom(behavior || 'follow', { addedCount, receiveInterval })
  }
}

async function toggleRecordDisplay(record) {
  const index = recordTypes.value.indexOf(record.display)
  const display = recordTypes.value[(index + 1) % recordTypes.value.length]
  const row = await setRecordDisplay(record.id, display)
  if (row) {
    rowsByIndex.value = {
      ...rowsByIndex.value,
      [row.index]: row,
    }
  }
}

function scrollToIndex(index, align = 'center') {
  cancelFollowScroll()
  if (index < totalCount.value - 1)
    emitStickToBottom(false)
  else
    emitStickToBottom(true)

  markProgrammaticScroll()
  rowVirtualizer.value.scrollToIndex(index, { align, behavior: 'auto' })
}

function scrollToBottom(options = {}) {
  emitStickToBottom(true)
  return loadVisibleRows({
    preferBottom: true,
    behavior: options.behavior || 'smooth',
    forceStick: true,
  })
}

function refresh() {
  refreshKey.value += 1
  loadVisibleRows()
}

function handleUserScrollIntent() {
  cancelFollowScroll()
  ignoreScrollUntil = 0
}

function handleTouchStart() {
  lastScrollTop = rootEl.value?.scrollTop || 0
  handleUserScrollIntent()
}

function handleScroll() {
  const el = rootEl.value
  if (!el)
    return

  const currentTime = now()
  const previousScrollTop = lastScrollTop
  const currentScrollTop = el.scrollTop
  const delta = currentScrollTop - previousScrollTop
  lastScrollTop = currentScrollTop

  if (currentTime < ignoreScrollUntil)
    return

  if (isNearBottom()) {
    emitStickToBottom(true)
    return
  }

  if (delta < -USER_SCROLL_LOCK_DELTA_PX)
    emitStickToBottom(false)
}

watch(
  () => [props.sessionId, totalCount.value],
  ([, value], [, oldValue] = []) => {
    const oldCount = typeof oldValue === 'number' ? oldValue : previousCount
    const addedCount = value > oldCount ? value - oldCount : 0
    const isAppend = typeof oldValue === 'number' && addedCount > 0
    const currentTime = now()
    const receiveInterval = isAppend && lastReceiveAt
      ? currentTime - lastReceiveAt
      : Number.POSITIVE_INFINITY

    if (isAppend)
      lastReceiveAt = currentTime
    if (value <= 0 || value < oldCount) {
      cancelFollowScroll()
      clearEnteringRows()
    }
    previousCount = value

    const shouldStick = props.stickToBottom && value > 0 && value !== oldValue
    loadVisibleRows({
      preferBottom: shouldStick,
      behavior: shouldStick ? 'follow' : undefined,
      addedCount,
      receiveInterval,
      enteringStartIndex: isAppend && shouldStick && isLiveList.value ? oldCount : undefined,
    })
  },
  { immediate: true },
)

watch(
  () => props.stickToBottom,
  (value, oldValue) => {
    if (value && !oldValue && totalCount.value > 0) {
      loadVisibleRows({ preferBottom: true, behavior: 'smooth', forceStick: true })
    }
    else if (!value && oldValue) {
      loadVisibleRows()
    }
  },
)

watch(refreshKey, () => {
  loadVisibleRows()
})

watch(
  () => virtualRows.value.map(row => row.index).join(','),
  () => {
    if (!props.stickToBottom)
      loadVisibleRows()
  },
)

onBeforeUnmount(() => {
  cancelFrame(bottomScrollFrameId)
  bottomScrollFrameId = 0
  cancelFollowScroll()
  clearEnteringRows()
})

defineExpose({
  scrollToIndex,
  scrollToBottom,
  refresh,
})
</script>

<template>
  <div
    ref="rootEl"
    class="overflow-y-auto p-2 relative record-panel h-full"
    @scroll="handleScroll"
    @wheel.passive="handleUserScrollIntent"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleUserScrollIntent"
  >
    <div v-if="totalCount === 0" class="h-full flex items-center justify-center text-center text-muted-foreground">
      <div>
        <div class="w-12 h-12 mx-auto mb-4 opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8" /></svg>
        </div>
        <p class="text-sm">
          {{ emptyText }}
        </p>
      </div>
    </div>

    <div v-else class="relative w-full" :style="{ height: `${totalSize}px` }">
      <div
        v-for="virtualRow in virtualRows"
        :key="virtualRow.key"
        :ref="measureElement"
        :data-index="virtualRow.index"
        class="absolute left-0 top-0 w-full px-1"
        :style="{ transform: `translateY(${virtualRow.start}px)` }"
      >
        <template v-if="rowsByIndex[virtualRow.index]">
          <div
            class="chat group"
            :class="[
              rowsByIndex[virtualRow.index].type === 'write' ? 'chat-end' : 'chat-start',
              { 'record-entering': isEnteringRow(virtualRow.index) },
            ]"
          >
            <div class="chat-header mx-2 flex">
              <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
                {{ formatRecordTime(rowsByIndex[virtualRow.index]) }}
              </div>
              <div class="w-4" />
              <div class="cursor-pointer" @click="() => toggleRecordDisplay(rowsByIndex[virtualRow.index])">
                {{ rowsByIndex[virtualRow.index].display }}
              </div>
              <div class="w-4" />
              <div class="text-xs opacity-50">
                {{ rowsByIndex[virtualRow.index].byteLength }} Bytes
              </div>
            </div>
            <div class="chat-bubble break-words text-sm">
              <div v-if="rowsByIndex[virtualRow.index].display === 'ascii'" v-html="rowsByIndex[virtualRow.index].html" />
              <div v-else>
                {{ rowsByIndex[virtualRow.index].text }}
              </div>
            </div>
            <div class="chat-footer mt-1">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" class="w-6 h-6 p-0.75 cursor-pointer" @click="() => copyRecordContent(rowsByIndex[virtualRow.index])">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2z" /></svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      复制
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="py-3 text-sm text-muted-foreground">
          加载中...
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  border-radius: 4px;
  margin: 15px;
}

::-webkit-scrollbar-button {
  width: 0;
  height: 0;
}

.record-entering {
  animation: record-enter 150ms cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: opacity, transform;
}

.chat-start.record-entering {
  transform-origin: left bottom;
}

.chat-end.record-entering {
  transform-origin: right bottom;
}

@keyframes record-enter {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.99);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .record-entering {
    animation: none;
  }
}
</style>
