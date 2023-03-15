<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { bufferToHexFormat, bufferToStr } from "@/utils/bufferConvert";
import { useScroll } from "@vueuse/core";
import { format } from "date-fns";
import { ref, watch } from "vue";

const { records, readingRecord, pinBottom } = useRecordStore();
const rootEl = ref(null);
const { x, y, isScrolling, arrivedState, directions } = useScroll(rootEl, {
  behavior: "smooth",
});
async function scrollToBottom() {
  rootEl.value.scrollTop = rootEl.value.scrollHeight;
}
watch(
  [records, readingRecord],
  () => {
    // if (arrivedState.bottom) {
    // TODO readingRecord很长时,只有接收完才会滚动到底部
    if (pinBottom.value) {
      // scrollToBottom();
      setTimeout(() => scrollToBottom(), 0);
    }
    // }
  },
  { deep: true }
);
</script>

<template>
  <div
    ref="rootEl"
    class="overflow-y-auto scroll-smooth p-2 relative record-panel"
  >
    <template v-for="record in records" :key="record.time">
      <div
        v-if="record.type == 'read'"
        class="chat chat-start"
        @click="scrollToBottom"
      >
        <div class="chat-header mx-2">
          <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
          <div class="text-sm opacity-70">
            {{ format(record.time, "HH:mm:ss:SSS") }}
          </div>
        </div>
        <div class="chat-bubble break-words text-lg">
          {{
            record.display == "hex"
              ? bufferToHexFormat(record.data)
              : bufferToStr(record.data)
          }}
        </div>
      </div>
      <div v-if="record.type == 'write'" class="chat chat-end">
        <div class="chat-header mx-2">
          <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
          <div class="text-sm opacity-70">
            {{ format(record.time, "HH:mm:ss:SSS") }}
          </div>
        </div>
        <div class="chat-bubble break-words text-lg">
          {{
            record.display == "hex"
              ? bufferToHexFormat(record.data)
              : bufferToStr(record.data)
          }}
        </div>
      </div>
    </template>
    <div class="chat chat-start" v-if="readingRecord">
      <div class="chat-header mx-2">
        <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
        <div class="text-sm opacity-70">
          {{ format(readingRecord.time, "HH:mm:ss:SSS") }}
        </div>
      </div>
      <div class="chat-bubble break-all text-lg">
        {{
          readingRecord.display == "hex"
            ? bufferToHexFormat(readingRecord.data)
            : bufferToStr(readingRecord.data)
        }}
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
