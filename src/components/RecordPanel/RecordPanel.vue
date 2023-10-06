<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useDataCode } from "@/utils/useDataCode/useDataCode";
import { refThrottled, useScroll } from "@vueuse/core";
import { format } from "date-fns";
import { computed, ref, watch } from "vue";
const { bufferToDecFormat ,bufferToHexFormat, bufferToString, stringToHtml } = useDataCode();
const { records, readingRecord, pinBottom } = useRecordStore();
const rootEl = ref(null);
const { x, y, isScrolling, arrivedState, directions } = useScroll(rootEl, {
  behavior: "smooth",
});
async function scrollToBottom() {
  rootEl.value.scrollTop = rootEl.value.scrollHeight + 2000;
}

async function toggoleRecordDisplay(record) {
  switch (record.display){
    case "hex":
      record.display = "ascii";
      break
    case "ascii":
      record.display = "dec";
      break
    case "dec":
      record.display = "hex";
      break
  }
}
const recordLength = computed(() => records.value.length);
watch(
  [recordLength, refThrottled(readingRecord, 150)],
  (value, oldValue) => {
    if (pinBottom.value & (value[0] != oldValue[0])) {
      setTimeout(() => scrollToBottom(), 0);
    }
  },
  { deep: true }
);
</script>

<template>
  <div
    ref="rootEl"
    class="overflow-y-auto scroll-smooth p-2 relative record-panel pb-10"
  >
    <template v-for="record in records" :key="record.time">
      <div v-if="record.type == 'read'" class="chat chat-start">
        <div class="chat-header mx-2 flex">
          <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
          <div class="text-sm opacity-70">
            {{ format(record.time, "HH:mm:ss:SSS") }}
          </div>
          <div class="w-4"></div>
          <div
            class="cursor-pointer"
            @click="() => toggoleRecordDisplay(record)"
          >
            {{ record.display }}
          </div>
        </div>
        <div class="chat-bubble break-words text-lg">
          <div v-if="record.display == 'hex'">
            {{ bufferToHexFormat(record.data) }}
          </div>
          <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))"></div>
          <div v-else>
            {{ bufferToDecFormat(record.data) }}
          </div>

          <!-- {{
            record.display == "hex"
              ? bufferToHexFormat(record.data)
              : stringToHtml(bufferToStr(record.data))
          }} -->
        </div>
      </div>
      <div v-if="record.type == 'write'" class="chat chat-end">
        <div class="chat-header mx-2 flex">
          <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
          <div class="text-sm opacity-70">
            {{ format(record.time, "HH:mm:ss:SSS") }}
          </div>
          <div class="w-4"></div>
          <div
            class="cursor-pointer"
            @click="() => toggoleRecordDisplay(record)"
          >
            {{ record.display }}
          </div>
        </div>
        <div class="chat-bubble break-words text-lg">
          <div v-if="record.display == 'hex'">
            {{ bufferToHexFormat(record.data) }}
          </div>
          <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))"></div>
          <div v-else>
            {{ bufferToDecFormat(record.data) }}
          </div>
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
        <div v-if="readingRecord.display == 'hex'">
          {{ bufferToHexFormat(readingRecord.data) }}
        </div>
        <div
          v-else
          v-html="stringToHtml(bufferToString(readingRecord.data))"
        ></div>
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
