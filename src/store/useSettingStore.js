import { computedAsync, useLocalStorage, useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

const deviceType = useLocalStorage('deviceType', 'serial', {
  listenToStorageChanges: false,
}) // serial, ble

const lineEndingMode = useLocalStorage('LineEnding:Mode', '无', {
  listenToStorageChanges: false,
})
const lineSelfEnding = useLocalStorage('LineEnding:Self', '', {
  listenToStorageChanges: false,
})

const terminalEnterMode = useLocalStorage('Terminal:EnterMode', 'CR', {
  listenToStorageChanges: false,
})

// 行尾换行符
const lineEnding = computedAsync(async () => {
  const endings = {
    无: '',
    LF: '\n',
    CR: '\r',
    CRLF: '\r\n',
    自定义: lineSelfEnding.value,
  }
  if (!(lineEndingMode.value in endings)) {
    lineEndingMode.value = '无'
  }
  return endings[lineEndingMode.value]
})

// 终端模式回车发送的换行符
const terminalEnter = computed(() => {
  const endings = {
    CR: '\r',
    LF: '\n',
    CRLF: '\r\n',
  }
  if (!(terminalEnterMode.value in endings)) {
    terminalEnterMode.value = 'CR'
  }
  return endings[terminalEnterMode.value]
})

// 发送输入框 hex 模式的输入模式 normal: 正常输入 format: 格式化输入
const sendHexInputMode = useLocalStorage('sendInputHexMode', 'format', {
  listenToStorageChanges: false,
})

// 记录缓存设置
const recordCacheEnabled = useStorage('recordCacheEnabled', ref(true))

export function useSettingStore() {
  return {
    lineEndingMode,
    lineSelfEnding,
    lineEnding,
    terminalEnterMode,
    terminalEnter,
    deviceType,
    sendHexInputMode,
    recordCacheEnabled,
  }
}
