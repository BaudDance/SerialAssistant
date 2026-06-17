<script setup>
import { useVirtualizer } from '@tanstack/vue-virtual'
import dayjs from 'dayjs'
import { computed, nextTick, ref, watch } from 'vue'
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

const { fetchRecordRows, setRecordDisplay, copyRecordContent, recordCount } = useRecordStore()
const { recordTypes } = useSerialStore()

const rootEl = ref(null)
const rowsByIndex = ref({})
const showFullDate = ref(false)
const refreshKey = ref(0)
let loadToken = 0
let snappingToBottom = false

const totalCount = computed(() => props.count ?? recordCount.value)
const rowVirtualizer = useVirtualizer(computed(() => ({
  count: totalCount.value,
  getScrollElement: () => rootEl.value,
  estimateSize: () => 96,
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

async function loadVisibleRows({ preferBottom = false } = {}) {
  const token = ++loadToken
  if (preferBottom && totalCount.value > 0) {
    snappingToBottom = true
    rowVirtualizer.value.scrollToIndex(totalCount.value - 1, { align: 'end', behavior: 'auto' })
    await nextTick()
    snappingToBottom = false
  }

  const rows = virtualRows.value
  if (!rows.length || totalCount.value === 0) {
    rowsByIndex.value = {}
    return
  }

  const start = Math.max(0, rows[0].index - 10)
  const end = Math.min(totalCount.value, rows[rows.length - 1].index + 11)
  const result = await fetchRecordRows(start, end, props.sessionId)
  if (token !== loadToken)
    return
  rowsByIndex.value = Object.fromEntries(result.map(row => [row.index, row]))
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
  rowVirtualizer.value.scrollToIndex(index, { align, behavior: 'auto' })
}

function scrollToBottom() {
  if (totalCount.value > 0)
    rowVirtualizer.value.scrollToIndex(totalCount.value - 1, { align: 'end', behavior: 'auto' })
}

function refresh() {
  refreshKey.value += 1
  loadVisibleRows()
}

watch(
  () => [props.sessionId, totalCount.value],
  ([, value], [, oldValue] = []) => {
    const shouldStick = props.stickToBottom && value > 0 && value !== oldValue
    loadVisibleRows({ preferBottom: shouldStick })
  },
  { immediate: true },
)

watch(
  () => [refreshKey.value, virtualRows.value.map(row => row.index).join(',')],
  () => {
    if (!snappingToBottom)
      loadVisibleRows()
  },
)

defineExpose({
  scrollToIndex,
  scrollToBottom,
  refresh,
})
</script>

<template>
  <div ref="rootEl" class="overflow-y-auto p-2 relative record-panel pb-10 h-full">
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
            :class="rowsByIndex[virtualRow.index].type === 'write' ? 'chat-end' : 'chat-start'"
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
</style>
