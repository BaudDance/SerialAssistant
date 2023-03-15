<script setup>
import SendPanel from "@/components/SendPanel/SendPanel.vue";
import SettingPanel from "@/components/SettingPanel/SettingPanel.vue";
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSerial } from "@/utils/useSerial";
import { provide } from "vue";
import ControlPanel from "./components/ControlPanel/ControlPanel.vue";
import RecordPanel from "./components/RecordPanel/RecordPanel.vue";
const { records, readingRecord } = useRecordStore();
const { readType } = useSerialStore();

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
      display: readType.type,
    };
  }
}

function onReadFrame(frame) {
  console.log("onReadFrame", frame);
  records.value.push({
    type: "read",
    data: frame,
    time: new Date(),
    display: readType.type,
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
        class="basis-1/4 border-solid border-2 border-gray-400 rounded-xl p-5"
      />
      <div class="w-7"></div>
      <div class="flex flex-col flex-grow basis-3/4">
        <RecordPanel
          class="basis-3/4 border-solid border-2 border-gray-400 rounded-xl"
        />
        <ControlPanel class="h-10" />
        <SendPanel
          class="basis-1/4 border-solid border-2 border-gray-400 rounded-xl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
