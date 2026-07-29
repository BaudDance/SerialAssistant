<script setup>
import { useTitle } from '@vueuse/core'
import { Loader2 } from 'lucide-vue-next'
import { computed, inject } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { validateGattProfile } from '@/utils/bleGatt'

const {
  connected,
  connecting,
  disconnecting,
  deviceName,
  requestDevice,
  connectDevice,
  device,
  disconnectDevice,
  isSupported,
} = inject('ble')
const {
  bleTypes,
  bleSelected,
  bleType,
  customServiceUuid,
  customWriteCharacteristicUuid,
  customNotifyCharacteristicUuid,
} = useBleStore()
const { createSession } = useRecordCache()
const { recordCacheEnabled } = useSettingStore()

const isCustomGatt = computed(() => !!bleType.value.custom)
const profileValidation = computed(() => validateGattProfile(bleType.value))
const settingsDisabled = computed(() => connected.value || connecting.value || disconnecting.value)

/**
 * 统一展示蓝牙操作错误并保留控制台诊断信息
 * @param {string} message 面向用户的错误标题
 * @param {unknown} error 原始异常对象
 * @returns {void} 此方法不返回数据
 */
function showBleError(message, error) {
  console.error(message, error)
  toast.error(`${message}：${error?.message || String(error)}`)
}

/**
 * 校验当前配置、选择设备并建立 GATT 连接
 * @returns {Promise<void>} 设备选择或连接流程结束后解决的 Promise
 */
async function selectDevice() {
  if (!profileValidation.value.valid) {
    toast.error(profileValidation.value.error)
    return
  }

  if (await requestDevice(profileValidation.value.profile)) {
    if (recordCacheEnabled.value) {
      // 如果启用了缓存，创建一个新缓存会话
      const _sessionId = createSession()
    }
    await connect()
  }
}

/**
 * 使用当前已选设备和 GATT 配置重新建立连接
 * @returns {Promise<void>} 连接尝试结束后解决的 Promise
 */
async function connect() {
  if (!profileValidation.value.valid) {
    toast.error(profileValidation.value.error)
    return
  }

  try {
    await connectDevice(profileValidation.value.profile)
  }
  catch (error) {
    showBleError('蓝牙 GATT 连接失败', error)
  }
}

/**
 * 断开当前 GATT 连接并展示可能的清理错误
 * @returns {Promise<void>} 断开流程结束后解决的 Promise
 */
async function disconnect() {
  try {
    await disconnectDevice()
  }
  catch (error) {
    showBleError('蓝牙断开失败', error)
  }
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
      <Select v-model="bleSelected" :disabled="settingsDisabled">
        <SelectTrigger class="w-full gap-1 px-2 text-xs">
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
    <div v-if="isCustomGatt" class="flex flex-col space-y-3 pb-4">
      <div class="space-y-2">
        <Label for="gatt-service-uuid">
          服务 UUID
        </Label>
        <Input
          id="gatt-service-uuid"
          v-model="customServiceUuid"
          autocomplete="off"
          placeholder="FFE0"
          :disabled="settingsDisabled"
          :aria-invalid="!profileValidation.valid"
        />
      </div>
      <div class="space-y-2">
        <Label for="gatt-write-uuid">
          写入特征 UUID
        </Label>
        <Input
          id="gatt-write-uuid"
          v-model="customWriteCharacteristicUuid"
          autocomplete="off"
          placeholder="FFE1"
          :disabled="settingsDisabled"
          :aria-invalid="!profileValidation.valid"
        />
      </div>
      <div class="space-y-2">
        <Label for="gatt-notify-uuid">
          通知特征 UUID（可选）
        </Label>
        <Input
          id="gatt-notify-uuid"
          v-model="customNotifyCharacteristicUuid"
          autocomplete="off"
          placeholder="FFE1"
          :disabled="settingsDisabled"
          :aria-invalid="customNotifyCharacteristicUuid && !profileValidation.valid"
        />
      </div>
      <p v-if="!profileValidation.valid" role="alert" class="text-destructive text-xs break-words">
        {{ profileValidation.error }}
      </p>
    </div>
    <Button
      v-if="!connected"
      class="cursor-pointer mb-3"
      :disabled="!isSupported || connecting || disconnecting || !profileValidation.valid"
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
      @click="disconnect"
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
