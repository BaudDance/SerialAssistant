<script setup>
import { inject, watch, watchEffect } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSerialStore } from '@/store/useSerialStore.js'

const {
  port,
  closePort,
  connected,
  portName,
  openPort,
  reopenPort,
  requestPort,
} = inject('serial')
const { baudRate, baudRateList, dataBits, stopBits, parity, flowControl } = useSerialStore()

function openSerialPort() {
  openPort({
    baudRate: Number.parseInt(baudRate.value),
    dataBits: Number.parseInt(dataBits.value),
    stopBits: Number.parseFloat(stopBits.value),
    parity: parity.value,
    flowControl: flowControl.value,
  })
}
watch([baudRate, dataBits, stopBits, parity, flowControl], (_newPort) => {
  if (!port.value || !connected)
    return
  reopenPort({
    baudRate: Number.parseInt(baudRate.value),
    dataBits: Number.parseInt(dataBits.value),
    stopBits: Number.parseFloat(stopBits.value),
    parity: parity.value,
    flowControl: flowControl.value,
  })
})

async function selectPort() {
  if (await requestPort()) {
    openSerialPort()
  }
}

function showdailog() {
  document.getElementById('serialrate_modal').showModal()
}

watchEffect(() => {
  if (baudRate.value === 'custom') {
    baudRate.value = 9600
    showdailog()
  }
})

// 数据位列表
const dataBitsList = {
  8: '8',
  7: '7',
  6: '6',
  5: '5',
}

// 校验位列表
const parityList = {
  none: 'None',
  even: 'Even',
  odd: 'Odd',
  mark: 'Mark',
  space: 'Space',
}

// 停止位列表
const stopBitsList = {
  1: '1',
  1.5: '1.5',
  2: '2',
  0: '0',
}
</script>

<template>
  <div class="flex flex-col p-4">
    <div class="flex flex-col gap-y-1.5 pb-4">
      <h3 class="font-semibold leading-none tracking-tight">
        串口设置
      </h3>
      <p class="text-xs text-muted-foreground">
        请选择串口连接相关参数
      </p>
    </div>

    <div class="flex flex-row lg:flex-col lg:space-y-3 pb-4">
      <Select v-model="baudRate">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择波特率" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>设置波特率</SelectLabel>
            <SelectItem v-for="item in baudRateList" :key="item" :value="item">
              波特率: {{ item }}
            </SelectItem>
            <SelectItem value="custom">
              自定义
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select v-model="dataBits">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择数据位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>设置数据位</SelectLabel>
            <SelectItem v-for="item in Object.keys(dataBitsList)" :key="item" :value="item">
              数据位: {{ dataBitsList[item] }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select v-model="parity">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择校验位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>设置校验位</SelectLabel>
            <SelectItem v-for="item in Object.keys(parityList)" :key="item" :value="item">
              校验位: {{ parityList[item] }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select v-model="stopBits">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择停止位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>设置停止位</SelectLabel>
            <SelectItem v-for="item in Object.keys(stopBitsList)" :key="item" :value="item">
              停止位: {{ stopBitsList[item] }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <Button v-if="!connected" class="cursor-pointer mb-3" @click="selectPort">
      {{ portName ?? "选择串口设备" }}
    </Button>
    <Button v-if="connected" class="cursor-pointer mb-3" variant="destructive" @click="closePort">
      断 开
    </Button>
    <Button v-if="!connected && port" class="cursor-pointer mb-3" variant="secondary" @click="openSerialPort">
      重 连
    </Button>
  </div>
</template>
