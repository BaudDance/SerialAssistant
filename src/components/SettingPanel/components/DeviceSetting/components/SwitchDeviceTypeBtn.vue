<script setup>
import { useSettingStore } from "@/store/useSettingStore";

const { deviceType } = useSettingStore();

function switchDeviceType() {
  if (deviceType.value == "serial") {
    deviceType.value = "ble";
  } else {
    deviceType.value = "serial";
  }
}
</script>
<template>
  <div class="tooltip" data-tip="点击切换设备类型">
    <button class="btn btn-square btn-outline btn-sm" @click="switchDeviceType">
      <img v-if="deviceType == 'serial'" src="/serial.svg" class="w-7 h-7" />
      <img v-else src="/ble.svg" class="w-7 h-7" />
    </button>
  </div>
</template>
