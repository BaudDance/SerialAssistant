<script setup>
import { useSerialStore } from "@/store/useSerialStore";
import { useSettingStore } from "@/store/useSettingStore";
import { inject, watch } from "vue";
import SwitchDeviceTypeBtn from "./components/SwitchDeviceTypeBtn.vue";
const {
  port,
  closePort,
  connected,
  portName,
  openPort,
  reopenPort,
  requestPort,
} = inject("serial");
const { baudRate, baudRateList, dataBits, stopBits, parity, flowControl } = useSerialStore();

const { deviceType } = useSettingStore();

function openSerialPort() {
  openPort({
    baudRate: parseInt(baudRate.value),
    dataBits: parseInt(dataBits.value),
    stopBits: parseFloat(stopBits.value),
    parity: parity.value,
    flowControl: flowControl.value,
  });
}
watch([baudRate, dataBits, stopBits, parity, flowControl], (newPort) => {
  if (!port.value || !connected) return;
  reopenPort({
    baudRate: parseInt(baudRate.value),
    dataBits: parseInt(dataBits.value),
    stopBits: parseFloat(stopBits.value),
    parity: parity.value,
    flowControl: flowControl.value,
  });
});

async function selectPort() {
  if (await requestPort()) {
    openSerialPort();
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex gap-x-2 items-center">
      <kbd class="kbd relative group cursor-pointer w-full" @click="selectPort">
        <div class="inline-block w-2 h-2 rounded m-1" :class="{
          'bg-green-500': connected,
          'bg-red-500': !connected,
        }"></div>
        {{ portName ?? "选择串口" }}
      </kbd>
      <SwitchDeviceTypeBtn v-if="!connected" />
    </div>

    <div class="h-3"></div>
    <div class="relative flex items-center group">
      <select class="select select-bordered w-full max-w-xs" v-model="baudRate">
        <option disabled>设置波特率</option>
        <option v-for="item in baudRateList" :value="item" :key="item">波特率: {{ item }}</option>
      </select>
      <div class="tooltip absolute right-14 invisible group-hover:visible" data-tip="自定义">
        <button class="btn btn-circle btn-xs badge-accent" onclick="serialrate_modal.showModal()">
          <span class="text-xs">＋</span>
        </button>
      </div>
    </div>
    <div class="h-3"></div>
    <select class="select select-bordered w-full max-w-xs" v-model="dataBits">
      <option disabled>设置数据位</option>
      <option selected value="8">数据位: 8</option>
      <option value="7">数据位: 7</option>
      <option value="6">数据位: 6</option>
      <option value="5">数据位: 5</option>
    </select>
    <div class="h-3"></div>
    <select class="select select-bordered w-full max-w-xs" v-model="parity">
      <option disabled>设置校验位</option>
      <option selected value="none">校验位: None</option>
      <option value="even">校验位: Even</option>
      <option value="odd">校验位: Odd</option>
      <option value="mark">校验位: Mark</option>
      <option value="space">校验位: Space</option>
    </select>
    <div class="h-3"></div>
    <select class="select select-bordered w-full max-w-xs" v-model="stopBits">
      <option disabled>设置停止位</option>
      <option selected value="1">停止位: 1</option>
      <option selected value="1.5">停止位: 1.5</option>
      <option selected value="2">停止位: 2</option>
      <option selected value="0">停止位: 0</option>
    </select>

    <div class="h-3"></div>
    <button class="btn btn-error" @click="closePort" v-if="connected">
      断 开
    </button>
    <button class="btn" @click="openSerialPort" v-if="!connected && port">
      重 连
    </button>
  </div>
</template>
