<script setup>
import { inject } from 'vue'
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
import { useBleStore } from '@/store/useBleStore'

const {
  connected,
  deviceName,
  requestDevice,
  connectDevice,
  device,
  disconnectDevice,
} = inject('ble')
const { bleTypes, bleType } = useBleStore()
async function selectDevice() {
  if (await requestDevice(bleType.value)) {
    connect()
  }
}
async function connect() {
  await connectDevice(bleType.value)
}
</script>

<template>
  <div class="flex flex-col p-4">
    <div class="flex flex-col gap-y-1.5 pb-4">
      <h3 class="font-semibold leading-none tracking-tight">
        蓝牙设置
      </h3>
      <p class="text-xs text-muted-foreground">
        请选择蓝牙连接相关参数
      </p>
    </div>
    <div class="flex flex-row lg:flex-col lg:space-y-3 pb-4">
      <Select v-model="bleType">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择蓝牙模块类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>设置蓝牙模块类型</SelectLabel>
            <SelectItem v-for="t in bleTypes" :key="t" :value="t">
              {{ t.name }}({{ t.description }})
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <Button v-if="!connected" class="cursor-pointer mb-3" @click="selectDevice">
      {{ deviceName ?? "选择蓝牙设备" }}
    </Button>
    <Button v-if="connected" class="cursor-pointer mb-3" variant="destructive" @click="disconnectDevice">
      断 开
    </Button>
    <Button v-if="!connected && device" class="cursor-pointer mb-3" variant="secondary" @click="connect">
      重 连
    </Button>
  </div>
</template>
