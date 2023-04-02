<script setup>
import ControlPanel from "@/components/ControlPanel/ControlPanel.vue";
import RecordPanel from "@/components/RecordPanel/RecordPanel.vue";
import SendPanel from "@/components/SendPanel/SendPanel.vue";
import SettingPanel from "@/components/SettingPanel/SettingPanel.vue";
import DownloadDriverModal from "@/modals/DownloadDriverModal/DownloadDriverModal.vue";
import SettingModal from "@/modals/SettingModal/SettingModal.vue";
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSerial } from "@/utils/useSerial";
import { provide } from "vue";
const { records, readingRecord, addRecord } = useRecordStore();
const { readType } = useSerialStore();

function onReadData(data) {
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
      display: readType.value,
    };
  }
}

function onReadFrame(frame) {
  addRecord({
    type: "read",
    data: frame,
    time: new Date(),
    display: readType.value,
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
    <div class="container aspect-video flex flex-nowrap relative">
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

      <div class="text-sm m-2 absolute -bottom-8 right-0">
        powered by 波特律动
      </div>
    </div>
  </div>
  <DownloadDriverModal />
  <SettingModal />
</template>

<style scoped></style>
