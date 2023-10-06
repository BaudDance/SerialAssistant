<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
const { readType, sendType } = useSerialStore();
const { pinBottom, clearRecords, readingRecord, rxCount, txCount } =
  useRecordStore();

function toggleReadType() {
  switch (readType.value) {
    case "hex":
      readType.value = "ascii";
      break
    case "ascii":
      readType.value = "dec";
      break
    case "dec":
      readType.value = 'hex';
      break
  }
}

function toggleSendType() {
  switch (sendType.value) {
    case "hex":
      sendType.value = "ascii";
      break
    case "ascii":
      sendType.value = "dec";
      break
    case "dec":
      sendType.value = 'hex';
      break
  }
}
function togglePinBottom() {
  pinBottom.value = !pinBottom.value;
}
</script>
<template>
  <div class="flex items-center mx-3">
    <div class="tooltip" data-tip="点击切换接收格式">
      <label
        class=" badge badge-outline text-white text-center"
        :class="readType === 'ascii' ? 'badge-warning': ( readType==='hex'? 'badge-info' : 'badge-error') "

        @click="toggleReadType"
      >
        <div class="fill-current w-15 m-2">接收:{{ readType.toUpperCase() }}</div>
      </label>
    </div>
    <div class="w-3"></div>
    <div class="tooltip" data-tip="点击切换发送格式">
      <label
        class="badge badge-outline text-white text-center"
        :class="sendType === 'ascii' ? 'badge-warning': ( sendType==='hex'? 'badge-info' : 'badge-error') "
        @click="toggleSendType"
      >
        <div class="swap-on m-2">发送: {{ sendType.toUpperCase() }}</div>
      </label>
    </div>
    <div class="w-3"></div>
    <div>Rx: {{ rxCount + (readingRecord?.data.length || 0) }} Bytes</div>
    <div class="w-3"></div>
    <div>Tx: {{ txCount }} Bytes</div>
    <div class="flex-1"></div>
    <!-- <button class="btn btn-outline btn-error btn-sm">清 屏</button> -->

    <div class="tooltip" data-tip="点击切换发送格式">
      <label
        class="swap badge badge-outline text-white text-center"
        :class="pinBottom ? ['swap-active', ' badge-info'] : ['badge-warning']"
        @click="togglePinBottom"
      >
        <div class="swap-on m-2">自动滚动</div>
        <div class="swap-off m-2">不滚动</div>
      </label>
    </div>
    <div class="w-3"></div>
    <div
      class="badge badge-error hover:badge-outline cursor-pointer select-none"
      @click="clearRecords"
    >
      清 屏
    </div>
  </div>
</template>
