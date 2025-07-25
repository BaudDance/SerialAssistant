<script setup>
import { refThrottled, useScroll } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'

const { bufferToDecFormat, bufferToHexFormat, bufferToString, stringToHtml } = useDataCode()
const { records, readingRecord, pinBottom, scrollToRecordIndex, copyRecordContent } = useRecordStore()
const { recordTypes } = useSerialStore()
const rootEl = ref(null)
const showFullDate = ref(false)
const { x, y, isScrolling, arrivedState, directions } = useScroll(rootEl, {
  behavior: 'smooth',
})
async function scrollToBottom() {
  rootEl.value.scrollTop = rootEl.value.scrollHeight + 2000
}

async function toggoleRecordDisplay(record) {
  const index = recordTypes.value.indexOf(record.display)
  record.display = recordTypes.value[(index + 1) % recordTypes.value.length]
}

function toggleTimeFormat() {
  showFullDate.value = !showFullDate.value
}

function formatTime(time) {
  return showFullDate.value
    ? dayjs(time).format('YYYY-MM-DD HH:mm:ss:SSS')
    : dayjs(time).format('HH:mm:ss:SSS')
}

const recordLength = computed(() => records.value.length)
watch(
  [recordLength, refThrottled(readingRecord, 150)],
  (value, oldValue) => {
    if (pinBottom.value & (value[0] != oldValue[0])) {
      setTimeout(() => scrollToBottom(), 0)
    }
  },
  { deep: true },
)

// 监听滚动到指定记录的请求
watch(scrollToRecordIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < records.value.length) {
    // 找到对应的记录元素并滚动到该位置
    setTimeout(() => {
      const recordElements = rootEl.value.querySelectorAll('.chat')
      if (recordElements[newIndex]) {
        recordElements[newIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 50)
  }
})
</script>

<template>
  <div ref="rootEl" class="overflow-y-auto scroll-smooth p-2 relative record-panel pb-10">
    <template v-for="record in records" :key="record.time">
      <div v-if="record.type == 'read'" class="chat chat-start group">
        <div class="chat-header mx-2 flex">
          <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
            {{ formatTime(record.time) }}
          </div>
          <div class="w-4" />
          <div class="cursor-pointer" @click="() => toggoleRecordDisplay(record)">
            {{ record.display }}
          </div>
        </div>
        <div class="chat-bubble break-words text-sm">
          <div v-if="record.display == 'hex'">
            {{ bufferToHexFormat(record.data) }}
          </div>
          <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))" />
          <div v-else>
            {{ bufferToDecFormat(record.data) }}
          </div>

          <!-- {{
            record.display == "hex"
              ? bufferToHexFormat(record.data)
              : stringToHtml(bufferToStr(record.data))
          }} -->
        </div>
        <div class="chat-footer mt-1">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon" class="w-6 h-6 p-0.75 cursor-pointer" @click="() => copyRecordContent(record)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z" /></svg>
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
      <div v-if="record.type == 'write'" class="chat chat-end group">
        <div class="chat-header mx-2 flex">
          <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
            {{ formatTime(record.time) }}
          </div>
          <div class="w-4" />
          <div class="cursor-pointer" @click="() => toggoleRecordDisplay(record)">
            {{ record.display }}
          </div>
        </div>
        <div class="chat-bubble break-words text-sm">
          <div v-if="record.display == 'hex'">
            {{ bufferToHexFormat(record.data) }}
          </div>
          <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))" />
          <div v-else>
            {{ bufferToDecFormat(record.data) }}
          </div>
        </div>
        <div class="chat-footer mt-1">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon" class="w-6 h-6 p-0.75 cursor-pointer" @click="() => copyRecordContent(record)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z" /></svg>
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
    <div v-if="readingRecord" class="chat chat-start">
      <div class="chat-header mx-2">
        <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
          {{ formatTime(readingRecord.time) }}
        </div>
      </div>
      <div class="chat-bubble break-all text-sm">
        <div v-if="readingRecord.display == 'hex'">
          {{ bufferToHexFormat(readingRecord.data) }}
        </div>
        <div v-else v-html="stringToHtml(bufferToString(readingRecord.data))" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* scroolbar like apple */
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
