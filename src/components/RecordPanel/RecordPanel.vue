<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { arrayBuffer2Hex } from "@/utils/bufferConvert";
import { format } from "date-fns";

const { records, readingRecord } = useRecordStore();
</script>

<template>
  <div class="overflow-y-auto scroll-smooth p-2 relative record-panel">
    <template v-for="record in records">
      <div v-if="record.type == 'read'" class="chat chat-start">
        <div class="chat-header mx-2">
          <!-- TODO 点击可以切换时间显示格式(是否显示日期) -->
          <div class="text-sm opacity-70">
            {{ format(record.time, "HH:mm:ss:SSS") }}
          </div>
        </div>
        <div class="chat-bubble break-words text-lg">
          {{ arrayBuffer2Hex(record.data) }}
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
          {{ arrayBuffer2Hex(record.data) }}
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
        {{ arrayBuffer2Hex(readingRecord.data) }}
      </div>
    </div>
    <!-- 接收类型标签 -->
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
