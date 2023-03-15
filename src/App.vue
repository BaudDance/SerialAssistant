<script setup>
import SettingPanel from "@/components/SettingPanel/SettingPanel.vue";
import { useRecordStore } from "@/store/useRecordStore";
import { arrayBuffer2Hex } from "@/utils/displayConvert";
import { useSerial } from "@/utils/useSerial";
import { provide } from "vue";
const { records, readingRecord } = useRecordStore();

function onReadData(data) {
  console.log("onReadData", data);
  if (readingRecord.value) {
    readingRecord.value = {
      ...readingRecord.value,
      data: Uint8Array.from([...readingRecord.value.data, ...data]),
    };
  } else {
    readingRecord.value = {
      type: "read",
      data: data,
      time: new Date(),
      display: "hex",
    };
  }
}

function onReadFrame(frame) {
  console.log("onReadFrame", frame);
  records.value.push({
    type: "read",
    data: frame,
    time: new Date(),
    display: "hex",
  });
  readingRecord.value = undefined;
}

const serial = useSerial({
  onReadData,
  onReadFrame,
});
provide("serial", serial);
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="container aspect-video flex flex-nowrap">
      <SettingPanel
        class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl p-5"
      />
      <div class="w-7"></div>
      <div class="flex flex-col flex-grow basis-3/4">
        <div
          class="basis-3/4 border-solid border-2 border-gray-400 rounded-3xl overflow-y-scroll p-x-5"
        >
          <template v-for="record in records">
            <div class="chat chat-start">
              <div class="chat-header">
                <time class="text-xs opacity-50">00:12:45 hex</time>
              </div>
              <div class="chat-bubble break-words">
                {{ arrayBuffer2Hex(record.data) }}
              </div>
            </div>
          </template>
          <div class="chat chat-start" v-if="readingRecord">
            <div class="chat-header">
              <time class="text-xs opacity-50">00:12:45 hex</time>
            </div>
            <div class="chat-bubble break-all">
              {{ arrayBuffer2Hex(readingRecord.data) }}
            </div>
          </div>
        </div>
        <div class="h-8"></div>
        <div
          class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
