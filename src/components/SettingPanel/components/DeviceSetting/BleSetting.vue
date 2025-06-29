<script setup>
import { inject } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
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
const { bleTypes, bleSelected, bleType } = useBleStore()

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
        {{ deviceName ?? "蓝牙设置" }}
      </h3>
      <p class="text-xs text-muted-foreground">
        请选择蓝牙连接相关参数
      </p>
    </div>
    <div class="flex flex-col space-y-3 pb-4">
      <label for="parity" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">模块类型</label>
      <Select v-model="bleSelected">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择蓝牙模块类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="t in bleTypes" :key="t.name" :value="t.name">
              {{ t.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <div class="text-xs text-muted-foreground">
        {{ bleType.description }}
      </div>
    </div>
    <Button v-if="!connected" class="cursor-pointer mb-3" @click="selectDevice">
      {{ deviceName ? "重新选择" : "选择蓝牙设备" }}
    </Button>
    <Button v-if="connected" class="cursor-pointer mb-3" variant="destructive" @click="disconnectDevice">
      断 开
    </Button>
    <Button v-if="!connected && device" class="cursor-pointer mb-3" variant="secondary" @click="connect">
      重 连
    </Button>
  </div>
</template>
