<script setup>
import { useTitle } from '@vueuse/core'
import { Loader2 } from 'lucide-vue-next'
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
import { useRecordCache } from '@/composables/useRecordCache'
import { useBleStore } from '@/store/useBleStore'
import { useSettingStore } from '@/store/useSettingStore'

const {
  connected,
  connecting,
  disconnecting,
  deviceName,
  requestDevice,
  connectDevice,
  device,
  disconnectDevice,
} = inject('ble')
const { bleTypes, bleSelected, bleType } = useBleStore()
const { createSession } = useRecordCache()
const { recordCacheEnabled } = useSettingStore()
async function selectDevice() {
  if (await requestDevice(bleType.value)) {
    if (recordCacheEnabled.value) {
    // 如果启用了缓存，创建一个新缓存会话
      const _sessionId = createSession()
    }
    connect()
  }
}
async function connect() {
  await connectDevice(bleType.value)
}

const pageTitle = computed(() => {
  let str = ''
  if (deviceName.value) {
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
      str = `${deviceName.value} - ${str}`
    }
  }
  else {
    if (connecting.value) {
      str = `蓝牙连接中...`
    }
    else if (disconnecting.value) {
      str = `蓝牙断开中...`
    }
    else if (connected.value) {
      str = `蓝牙已连接`
    }
    else {
      str = `蓝牙设置`
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
        {{ deviceName ?? "蓝牙设置" }}
      </h3>
      <p class="text-muted-foreground">
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
      <div class="text-muted-foreground">
        {{ bleType.description }}
      </div>
    </div>
    <Button
      v-if="!connected"
      class="cursor-pointer mb-3"
      :disabled="connecting || disconnecting"
      @click="selectDevice"
    >
      <Loader2 v-if="connecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ connecting ? '连接中...' : (deviceName ? "重新选择" : "选择蓝牙设备") }}
    </Button>
    <Button
      v-if="connected"
      class="cursor-pointer mb-3"
      variant="destructive"
      :disabled="connecting || disconnecting"
      @click="disconnectDevice"
    >
      <Loader2 v-if="disconnecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ disconnecting ? '断开中...' : '断 开' }}
    </Button>
    <Button
      v-if="!connected && device"
      class="cursor-pointer mb-3"
      variant="secondary"
      :disabled="connecting || disconnecting"
      @click="connect"
    >
      <Loader2 v-if="connecting" class="w-4 h-4 mr-2 animate-spin" />
      {{ connecting ? '连接中...' : '重 连' }}
    </Button>
  </div>
</template>
