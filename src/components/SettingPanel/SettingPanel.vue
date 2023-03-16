<script setup>
import { useSerialStore } from "@/store/useSerialStore";
import { inject, watch } from "vue";
const {
  port,
  closePort,
  connected,
  portName,
  openPort,
  reopenPort,
  requestPort,
} = inject("serial");
const { baudRate, dataBits, stopBits, parity, flowControl } = useSerialStore();

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
    <!-- 显示 -->
    <kbd class="kbd relative group cursor-pointer" @click="selectPort">
      <div
        class="inline-block w-2 h-2 rounded m-1"
        :class="{
          'bg-green-500': connected,
          'bg-red-500': !connected,
        }"
      ></div>
      {{ portName ?? "选择串口" }}
    </kbd>
    <!-- <button class="btn btn-outline" @click="addPort">{{ portName }}</button> -->
    <div class="h-3"></div>
    <select class="select select-bordered w-full max-w-xs" v-model="baudRate">
      <option disabled>设置波特率</option>
      <option selected value="9600">波特率: 9600</option>
      <option value="19200">波特率: 19200</option>
      <option value="38400">波特率: 38400</option>
      <option value="57600">波特率: 57600</option>
      <option value="115200">波特率: 115200</option>
    </select>
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
    </select>
    <div class="h-3"></div>
    <button class="btn btn-error" @click="closePort" v-if="connected">
      断 开
    </button>
    <button class="btn" @click="openSerialPort" v-if="!connected && port">
      重 连
    </button>
    <div class="flex-1"></div>
    <div class="flex gap-x-2">
      <a href="https://github.com/BaudDance/SerialAssistant" target="_blank">
        <img src="/github.svg" class="w-7 h-7" />
      </a>
      <a href="https://space.bilibili.com/6100925" target="_blank">
        <img src="/bilibili.svg" class="w-7 h-7" />
      </a>
    </div>
  </div>
</template>
