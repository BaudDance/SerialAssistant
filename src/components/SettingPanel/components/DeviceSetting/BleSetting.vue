<script setup>
import { useBleStore } from "@/store/useBleStore";
import { inject } from "vue";
import SwitchDeviceTypeBtn from "./components/SwitchDeviceTypeBtn.vue";

const {
  connected,
  deviceName,
  requestDevice,
  connectDevice,
  device,
  disconnectDevice,
} = inject("ble");
const { bleTypes, bleType } = useBleStore();
async function selectDevice() {
  if (await requestDevice(bleType.value)) {
    connect();
  }
}
async function connect() {
  await connectDevice(bleType.value);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex gap-x-2 items-center">
      <kbd
        class="kbd relative group cursor-pointer w-full"
        @click="selectDevice"
      >
        <div
          class="inline-block w-2 h-2 rounded m-1"
          :class="{
            'bg-green-500': connected,
            'bg-red-500': !connected,
          }"
        ></div>
        {{ deviceName ?? "选择蓝牙" }}
      </kbd>
      <SwitchDeviceTypeBtn v-if="!connected" />
    </div>
    <div class="h-3"></div>
    <select class="select select-bordered w-full max-w-xs" v-model="bleType">
      <option disabled>设置蓝牙模块类型</option>
      <option v-for="t in bleTypes" :value="t">
        <div class="tooltip" :data-tip="t.description">
          {{ t.name }}({{ t.description }})
        </div>
      </option>
    </select>
    <div class="h-3"></div>
    <button class="btn btn-error" @click="disconnectDevice" v-if="connected">
      断 开
    </button>
    <button class="btn" @click="connect" v-if="!connected && device">
      重 连
    </button>
  </div>
</template>
