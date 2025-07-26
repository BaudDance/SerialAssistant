<script setup>
import { useTitle } from '@vueuse/core'
import { Loader2 } from 'lucide-vue-next'
import { inject, watch } from 'vue'
import { useDialog } from '@/components/Dialog'
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
  connecting,
  disconnecting,
  portName,
  openPort,
  reopenPort,
  requestPort,
} = inject('serial')
const { baudRate, baudRateList, dataBits, stopBits, parity, flowControl, serialRate, defaultBaudRateList } = useSerialStore()
const { open } = useDialog()
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

// 数据位列表
const dataBitsList = [
  8,
  7,
  6,
  5,
]

// 校验位列表
const parityList = {
  none: 'None',
  even: 'Even',
  odd: 'Odd',
  mark: 'Mark',
  space: 'Space',
}

// 停止位列表
const stopBitsList = [
  1,
  1.5,
  2,
  0,
]

const pageTitle = computed(() => {
  let str = ''
  if (portName.value) {
    if (connecting.value) {
      str = `${str} - 连接中...`
    }
    else if (disconnecting.value) {
      str = `${str} - 断开中...`
    }
    else if (connected.value) {
      str = `${str} - 已连接`
    }
    else {
      str = `${portName.value} - ${str}`
    }
  }
  else {
    if (connecting.value) {
      str = `串口连接中...`
    }
    else if (disconnecting.value) {
      str = `串口断开中...`
    }
    else if (connected.value) {
      str = `串口已连接`
    }
    else {
      str = `串口设置`
    }
  }
  return str
})
// 注入页面标题
useTitle(pageTitle)
</script>

<template>
  <div class="flex flex-col p-4">
    <div class="flex flex-col gap-y-1.5 pb-4">
      <h3 class="font-semibold leading-none tracking-tight">
        {{ portName ?? "串口设置" }}
      </h3>
      <p class="text-muted-foreground">
        请选择串口连接相关参数
      </p>
    </div>

    <div class="flex flex-col space-y-3 pb-4">
      <label for="baudRate" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">波特率</label>
      <Select v-model="baudRate">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择波特率" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="item in baudRateList" :key="item" :value="item">
              {{ item }}
            </SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>
              <Button variant="ghost" class="cursor-pointer" @click.stop="open('serialRate')">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg>
                添加自定义
              </Button>
            </SelectLabel>
          </SelectGroup>
        </SelectContent>
      </Select>
      <label for="dataBits" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">数据位</label>
      <Select v-model="dataBits">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择数据位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="item in dataBitsList" :key="item" :value="item">
              {{ item }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <label for="parity" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">校验位</label>
      <Select v-model="parity">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择校验位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="item in Object.keys(parityList)" :key="item" :value="item">
              {{ parityList[item] }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <label for="stopBits" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">停止位</label>
      <Select v-model="stopBits">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择停止位" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="item in stopBitsList" :key="item" :value="item">
              {{ item }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <Button
      v-if="!connected"
      class="cursor-pointer mb-3"
      :disabled="connecting || disconnecting"
      @click="selectPort"
    >
      <Loader2 v-if="connecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ connecting ? '连接中...' : (portName ? "重新选择" : "选择串口设备") }}
    </Button>
    <Button
      v-if="connected"
      class="cursor-pointer mb-3"
      variant="destructive"
      :disabled="connecting || disconnecting"
      @click="closePort"
    >
      <Loader2 v-if="disconnecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ disconnecting ? '断开中...' : '断 开' }}
    </Button>
    <Button
      v-if="!connected && port"
      class="cursor-pointer mb-3"
      variant="secondary"
      :disabled="connecting || disconnecting"
      @click="openSerialPort"
    >
      <Loader2 v-if="connecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ connecting ? '连接中...' : '重 连' }}
    </Button>
  </div>
</template>
