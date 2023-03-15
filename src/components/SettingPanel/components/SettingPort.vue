<script setup>
import { useSerialStore } from "@/store/useSerialStore";
import { inject } from "vue";
const { port, setPort, portName, openPort, sendHex } = inject("serial");
const { baudRate, dataBits, stopBits, parity, flowControl } = useSerialStore();

function openSerialPort() {
  openPort({
    baudRate: parseInt(baudRate),
    dataBits: parseInt(dataBits),
    stopBits: parseFloat(stopBits),
    parity: parity,
    flowControl: flowControl,
  });
}
function sendTest() {
  sendHex();
}
</script>

<template>
  <div class="flex flex-col">
    <!-- 显示 -->
    <kbd class="kbd relative group"
      >{{ portName }}
      <div
        class="absolute right-3 text-red-500 hidden group-hover:block cursor-default"
        @click="setPort(null)"
      >
        x
      </div>
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
    <button class="btn" @click="openSerialPort">连 接</button>
    <button class="btn" @click="sendTest">发生</button>
  </div>
</template>
