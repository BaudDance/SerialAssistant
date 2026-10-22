<script setup>
import { useDark } from '@vueuse/core'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { Eraser } from 'lucide-vue-next'
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useLayout } from '@/composables/useLayout'
import { useSerialDataFont } from '@/composables/useSerialDataFont'
import { useSettingStore } from '@/store/useSettingStore.js'
import { normalizeTerminalInput, shouldCopySelection } from './terminalInput'
import darkThemeJson from './theme/xterm/vscode/DarkModern.json'
import lightThemeJson from './theme/xterm/vscode/GitHub-Light-Default.json'

import WelcomeToTerminal from './WelcomeToTerminal.vue'

import '@xterm/xterm/css/xterm.css'

const { deviceType, terminalEnter, serialDataFontFamily } = useSettingStore()
const { activeSerialDataFontStack, ensureSerialDataFontReady } = useSerialDataFont()
const { showTerminalMode } = useLayout()
const serial = inject('serial')
const ble = inject('ble')
const isConnected = computed(() => serial.connected.value || ble.connected.value)
const isDark = useDark()
const terminalAreaRef = ref(null)
const terminalExists = ref(false)
const clearingTerminal = ref(false)

let term = null
let cleanupTerminalData = null
let fitAddon = null
let terminalOpened = false
let terminalInitToken = 0
let fontApplyToken = 0
let terminalGeneration = 0

function currentTheme() {
  return isDark.value
    ? { ...darkThemeJson, background: 'oklch(0.145 0 0)' }
    : lightThemeJson
}

const xtermOptions = computed(() => ({
  fontFamily: activeSerialDataFontStack.value,
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 20,
  scrollback: 10000,
  theme: currentTheme(),
}))

function fitTerm() {
  if (!term || !fitAddon || !terminalOpened || !isConnected.value || !showTerminalMode.value)
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

async function initTerminal() {
  const el = terminalAreaRef.value
  if (!el || !isConnected.value || !showTerminalMode.value)
    return

  if (!term) {
    term = new Terminal(xtermOptions.value)
    fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    const currentTerm = term
    currentTerm.attachCustomKeyEventHandler((event) => {
      if (shouldCopySelection(event, currentTerm.hasSelection()))
        return false
      return true
    })
    currentTerm.onData((word) => {
      sendData(normalizeTerminalInput(word, terminalEnter.value))
    })
    cleanupTerminalData = serial.onTerminalData?.(({ dataBuffer, batchId, generation }) => {
      if (term !== currentTerm || generation < terminalGeneration) {
        serial.ackTerminalData?.(batchId)
        return
      }
      currentTerm.write(new Uint8Array(dataBuffer), () => {
        serial.ackTerminalData?.(batchId)
      })
    })
  }

  updateTerminalActive()

  if (terminalOpened) {
    fitTerm()
    term.focus()
    return
  }

  const initToken = ++terminalInitToken
  const fontStack = await ensureSerialDataFontReady(serialDataFontFamily.value)
  if (initToken !== terminalInitToken || !term || !isConnected.value || !showTerminalMode.value)
    return

  term.options.fontFamily = fontStack
  term.open(el)
  terminalOpened = true
  terminalExists.value = true
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
  term?.dispose()
  term = null
  terminalExists.value = false
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
        term
        && isConnected.value
        && showTerminalMode.value
        && document.visibilityState === 'visible'
        && !clearingTerminal.value,
      )
  const result = serial.setTerminalActive?.(active)
  result?.catch?.((error) => {
    console.warn('更新终端接收状态失败:', error)
  })
  return result
}

async function clearTerminal() {
  if (!term || clearingTerminal.value)
    return

  clearingTerminal.value = true
  updateTerminalActive(false)
  try {
    const { generation } = await serial.clearTerminalOutput()
    terminalGeneration = generation
    const currentTerm = term
    await new Promise(resolve => currentTerm.write('', resolve))
    if (term !== currentTerm)
      return
    currentTerm.clear()
    currentTerm.clearSelection()
    if (isConnected.value && showTerminalMode.value)
      currentTerm.focus()
  }
  catch (error) {
    console.error('清空终端失败:', error)
    toast.error('清空终端失败')
  }
  finally {
    clearingTerminal.value = false
    updateTerminalActive()
  }
}

watch(isDark, () => {
  if (term)
    term.options.theme = currentTheme()
})

watch(serialDataFontFamily, async (family) => {
  const applyToken = ++fontApplyToken
  const fontStack = await ensureSerialDataFontReady(family)
  if (!term || applyToken !== fontApplyToken)
    return

  term.options.fontFamily = fontStack
  if (!terminalOpened)
    return

  term.clearTextureAtlas()
  fitTerm()
  term.refresh(0, term.rows - 1)
})

watch([isConnected, showTerminalMode], async ([connected, visible]) => {
  if (!connected || !visible) {
    terminalInitToken += 1
    updateTerminalActive(false)
    return
  }
  await nextTick()
  initTerminal().catch(error => console.error('初始化终端失败:', error))
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
  <div class="h-full w-full relative p-2 overflow-hidden flex flex-col">
    <div class="shrink-0 flex justify-end pb-2">
      <Button variant="outline" size="sm" class="cursor-pointer" :disabled="!terminalExists || clearingTerminal" @click="clearTerminal">
        <Eraser class="size-4" />
        清空终端
      </Button>
    </div>
    <div class="min-h-0 flex-1">
      <WelcomeToTerminal v-if="!isConnected" />
      <div v-show="isConnected" id="terminalArea" ref="terminalAreaRef" class="h-full w-full" />
    </div>
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
