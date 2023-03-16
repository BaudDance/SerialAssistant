<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
const { readType, sendType } = useSerialStore();
const { pinBottom } = useRecordStore();

function toggleReadType() {
  readType.value = readType.value == "hex" ? "ascii" : "hex";
}

function toggleSendType() {
  sendType.value = sendType.value == "hex" ? "ascii" : "hex";
}
function togglePinBottom() {
  pinBottom.value = !pinBottom.value;
}
</script>
<template>
  <div class="flex items-center mx-3">
    <div class="tooltip" data-tip="点击切换接收格式">
      <label
        class="swap badge badge-info badge-outline text-white text-center"
        :class="
          readType == 'hex' ? ['swap-active', ' badge-info'] : ['badge-warning']
        "
        @click="toggleReadType"
      >
        <div class="swap-on fill-current w-15 m-2">接收:HEX</div>
        <div class="swap-off fill-current w-15 m-2">接收:ASCII</div>
      </label>
    </div>
    <div class="w-3"></div>
    <div class="tooltip" data-tip="点击切换发送格式">
      <label
        class="swap badge badge-outline text-white text-center"
        :class="
          sendType == 'hex' ? ['swap-active', ' badge-info'] : ['badge-warning']
        "
        @click="toggleSendType"
      >
        <div class="swap-on fill-current w-15 m-2">发送:HEX</div>
        <div class="swap-off fill-current w-15 m-2">发送:ASCII</div>
      </label>
    </div>
    <div class="flex-1"></div>
    <div class="tooltip" data-tip="点击切换发送格式">
      <label
        class="swap badge badge-outline text-white text-center"
        :class="pinBottom ? ['swap-active', ' badge-info'] : ['badge-warning']"
        @click="togglePinBottom"
      >
        <div class="swap-on fill-current w-15 m-2">自动滚动</div>
        <div class="swap-off fill-current w-15 m-2">不滚动</div>
      </label>
    </div>
  </div>
</template>
