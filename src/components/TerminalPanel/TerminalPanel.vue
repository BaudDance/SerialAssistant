<script setup>
import { useDark } from '@vueuse/core'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { inject, nextTick, onBeforeUnmount } from 'vue'
import { useSerialDataFont } from '@/composables/useSerialDataFont'
import { useSettingStore } from '@/store/useSettingStore.js'
import { normalizeTerminalInput } from './terminalInput'
import darkThemeJson from './theme/xterm/vscode/DarkModern.json'
// import darkThemeJson from './theme/xterm/vscode/Dark+.json'
import lightThemeJson from './theme/xterm/vscode/GitHub-Light-Default.json'

import WelcomeToTerminal from './WelcomeToTerminal.vue'

import '@xterm/xterm/css/xterm.css'

const { deviceType, terminalEnter, serialDataFontFamily } = useSettingStore()
const { activeSerialDataFontStack, ensureSerialDataFontReady } = useSerialDataFont()
// 获取串口和蓝牙连接状态
const serial = inject('serial')
const ble = inject('ble')
// const { isConnected, terminalTmplRef, terminalInstance: term, setInstance } = useTerminalStore()
// 是否已连接设备
const isConnected = computed(() => serial.connected.value || ble.connected.value)

const isDark = useDark()

// xterm 实例
window.term = null
let cleanupTerminalData = null
let fitAddon = null
let terminalOpened = false
let terminalInitToken = 0
let fontApplyToken = 0

const xtermOptions = computed(() => ({
  fontFamily: activeSerialDataFontStack.value,
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 20,
  theme: isDark.value
    ? Object.assign({}, darkThemeJson, { background: 'oklch(0.145 0 0)' })
    : lightThemeJson,
}))

function fitTerm() {
  if (!window.term || !fitAddon || !terminalOpened)
    return
  fitAddon.fit()
}

function sendData(data) {
  let buffer
  if (typeof data === 'string') {
    // 如果是字符串，转换为UTF-8字节数组
    const encoder = new TextEncoder()
    buffer = encoder.encode(data)
  }
  else if (data instanceof Uint8Array) {
    // 如果已经是Uint8Array，直接使用
    buffer = data
  }
  else if (Array.isArray(data)) {
    // 如果是数组，转换为Uint8Array
    buffer = new Uint8Array(data)
  }
  else {
    console.error('不支持的数据类型:', typeof data)
    return
  }

  if (deviceType.value === 'serial') {
    serial.sendHex(buffer)
  }
  else {
    ble.sendHex(buffer)
  }
  console.debug('数据发送成功:', buffer)
}

async function initTerminal(el) {
  if (!el || window.term)
    return

  const initToken = ++terminalInitToken
  const term = new Terminal(xtermOptions.value)
  const currentFitAddon = new FitAddon()
  window.term = term
  fitAddon = currentFitAddon
  term.loadAddon(currentFitAddon)

  // 输入事件
  term.onData((word) => {
    console.log('term.onData', word)
    sendData(normalizeTerminalInput(word, terminalEnter.value))
  })

  cleanupTerminalData = serial.onTerminalData?.(({ dataBuffer }) => {
    if (window.term !== term) {
      serial.ackTerminalData?.()
      return
    }
    term.write(new Uint8Array(dataBuffer), () => {
      serial.ackTerminalData?.()
    })
  })
  updateTerminalActive()

  const fontStack = await ensureSerialDataFontReady(serialDataFontFamily.value)
  if (initToken !== terminalInitToken || window.term !== term || !isConnected.value)
    return

  term.options.fontFamily = fontStack
  term.open(el)
  terminalOpened = true
  term.focus()
  fitTerm()
  onTerminalResize()
}

function disposeTerminal() {
  terminalInitToken += 1
  fontApplyToken += 1
  updateTerminalActive(false)
  cleanupTerminalData?.()
  cleanupTerminalData = null
  removeResizeListener()
  window.term?.dispose()
  window.term = null
  fitAddon = null
  terminalOpened = false
}

function onTerminalResize() {
  removeResizeListener()
  window.addEventListener('resize', fitTerm)
}
function removeResizeListener() {
  window.removeEventListener('resize', fitTerm)
}

function updateTerminalActive(forceActive) {
  const active = typeof forceActive === 'boolean'
    ? forceActive
    : Boolean(
        window.term
        && isConnected.value
        && deviceType.value === 'serial'
        && document.visibilityState === 'visible',
      )
  const result = serial.setTerminalActive?.(active)
  result?.catch?.((error) => {
    console.warn('更新终端接收状态失败:', error)
  })
}

watch(isDark, (val) => {
  if (window.term) {
    window.term.options.theme = val ? Object.assign({}, darkThemeJson, { background: 'oklch(0.145 0 0)' }) : lightThemeJson
  }
})

watch(serialDataFontFamily, async (family) => {
  const applyToken = ++fontApplyToken
  const fontStack = await ensureSerialDataFontReady(family)
  const term = window.term
  if (!term || applyToken !== fontApplyToken)
    return

  term.options.fontFamily = fontStack
  if (!terminalOpened)
    return

  term.clearTextureAtlas()
  fitTerm()
  term.refresh(0, term.rows - 1)
})

watch(isConnected, (val) => {
  if (val) {
    nextTick(() => {
      initTerminal(document.getElementById('terminalArea'))
    })
  }
  else {
    disposeTerminal()
  }
}, { immediate: true })

watch(deviceType, () => {
  updateTerminalActive()
})

function onVisibilityChange() {
  updateTerminalActive()
}

document.addEventListener('visibilitychange', onVisibilityChange)

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  removeResizeListener()
  disposeTerminal()
})

defineExpose({
  fit() {
    nextTick(() => {
      fitTerm()
    })
  },
})
</script>

<template>
  <div class="h-full w-full relative p-2 overflow-hidden">
    <WelcomeToTerminal v-if="!isConnected" />
    <div v-else id="terminalArea" class="h-full w-full" />
  </div>
</template>

<style>
/* XTerm 滚动条样式优化 */
.xterm .xterm-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--muted-foreground) transparent;
}

.xterm .xterm-viewport::-webkit-scrollbar {
  width: 8px;
}

.xterm .xterm-viewport::-webkit-scrollbar-button {
  display: none;
}

.xterm .xterm-viewport::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.xterm .xterm-viewport::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.xterm .xterm-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

.xterm .xterm-viewport::-webkit-scrollbar-thumb:active {
  background: var(--primary);
}

/* 暗色模式下的滚动条优化 */
.dark .xterm .xterm-viewport {
  scrollbar-color: var(--muted-foreground) transparent;
}

.dark .xterm .xterm-viewport::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
}

.dark .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

.dark .xterm .xterm-viewport::-webkit-scrollbar-thumb:active {
  background: var(--primary);
}

/* 终端容器样式优化 */
#terminalArea .xterm {
  /* border-radius: var(--radius); */
  overflow: hidden;
}

#terminalArea .xterm .xterm-screen {
  /* border-radius: var(--radius); */
}
</style>
