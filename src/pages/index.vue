<script setup>
import { defineAsyncComponent, onBeforeUnmount, provide, ref, watch } from 'vue'
import ActivityBar from '@/components/ActivityBar/ActivityBar.vue'
import ControlPanel from '@/components/ControlPanel/ControlPanel.vue'
import RecordPanel from '@/components/RecordPanel/RecordPanel.vue'
import SendPanel from '@/components/SendPanel/SendPanel.vue'
import DeviceSetting from '@/components/SettingPanel/DeviceSetting.vue'
import StatusBar from '@/components/StatusBar/StatusBar.vue'
import TopBar from '@/components/TopBar/TopBar.vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'
import { useBle } from '@/composables/useBle'
import { useLayout } from '@/composables/useLayout'
import { useRecordCache } from '@/composables/useRecordCache'
import { useSerial } from '@/composables/useSerial'
import { listenNetworkStatus } from '@/network'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import 'vue-sonner/style.css'

defineOptions({
  name: '主页',
})

const DialogProvider = defineAsyncComponent(() => import('@/components/Dialog/Provider.vue'))

const { readingRecord, addRecord } = useRecordStore()
const { currentSessionId, createSession } = useRecordCache()
const { recordCacheEnabled } = useSettingStore()
const { readType } = useSerialStore()
const { showFullScreen, showTerminalMode, fullScreenBreakpoint, showSettingPanel, showQuickInputPanel, showSendPanel } = useLayout()
const settingPanelRef = ref()
const sendPanelRef = ref()

watch(showSettingPanel, (newVal) => {
  if (newVal) {
    settingPanelRef.value?.expand()
  }
  else {
    settingPanelRef.value?.collapse()
  }
})
watch(showSendPanel, (newVal) => {
  if (newVal) {
    sendPanelRef.value?.expand()
  }
  else {
    sendPanelRef.value?.collapse()
  }
})
const cleanupNetworkListener = listenNetworkStatus()

// 保存用户在大屏幕下的全屏偏好
const userFullScreenPreference = ref(showFullScreen.value)

watch(fullScreenBreakpoint, (newVal) => {
  if (newVal) {
    // 小于lg时，保存当前状态并强制全屏
    if (!showFullScreen.value) {
      userFullScreenPreference.value = false
    }
    showFullScreen.value = true
  }
  else {
    // 大于等于lg时，恢复用户偏好
    showFullScreen.value = userFullScreenPreference.value
  }
}, { immediate: true })

// 监听用户主动切换全屏状态（仅在大屏幕时更新偏好）
watch(showFullScreen, (newVal) => {
  if (!fullScreenBreakpoint.value) {
    userFullScreenPreference.value = newVal
  }
})

function onReadData(data) {
  if (readingRecord.value) {
    readingRecord.value = {
      ...readingRecord.value,
      data: Uint8Array.from([...readingRecord.value.data, ...data]),
    }
  }
  else {
    readingRecord.value = {
      type: 'read',
      data,
      time: new Date(),
      display: readType.value,
    }
  }
}

function onReadFrame(frame) {
  addRecord({
    type: 'read',
    data: frame,
    time: new Date(),
    display: readType.value,
  })
  readingRecord.value = undefined
}

const serial = useSerial({
  onReadData,
  onReadFrame,
})
provide('serial', serial)

const ble = useBle({ onReadFrame })
provide('ble', ble)

const terminalPanelRef = ref(null)
function onTerminalAreaResize(_size, _prevSize) {
  console.log('终端区域调整大小')
  terminalPanelRef.value?.fit()
}

// 资源清理 - 防止内存泄露
onBeforeUnmount(async () => {
  console.log('App组件卸载，开始清理资源...')

  try {
    // 关闭串口连接
    if (serial.connected.value) {
      console.log('关闭串口连接')
      await serial.closePort()
    }

    // 断开蓝牙连接
    if (ble.connected.value) {
      console.log('断开蓝牙连接')
      await ble.disconnectDevice()
    }

    // 清理网络状态监听器
    if (cleanupNetworkListener) {
      console.log('清理网络状态监听器')
      cleanupNetworkListener()
    }

    console.log('资源清理完成')
  }
  catch (error) {
    console.error('资源清理过程中出现错误:', error)
  }
})

// 监听页面卸载事件 - 拦截未断开连接的情况
if (typeof window !== 'undefined') {
  const handleBeforeUnload = (event) => {
    // 检查是否有活跃的连接
    const hasActiveConnection = serial.connected.value || ble.connected.value

    if (hasActiveConnection) {
      // 阻止页面关闭
      event.preventDefault()

      // 设置提示信息
      const message = '检测到串口或蓝牙连接仍处于活跃状态，请先断开连接后再关闭页面。'
      event.returnValue = message // 兼容旧版浏览器
      /**
       * 现代浏览器（Chrome、Firefox、Edge、Safari等）出于 安全考虑 ，不再允许网站自定义 beforeunload 事件的提示信息
       * 这是为了防止恶意网站使用误导性信息欺骗用户
       */
      return message // 实际上现代浏览器只会显示标准的通用提示，如"重新加载站点?"或"离开此网站?"
    }

    // 如果没有活跃连接，允许正常关闭
    return undefined
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  // 在组件卸载时也要移除这个监听器
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}

onMounted(() => {
  if (recordCacheEnabled.value && !currentSessionId.value) {
    // 如果启用了缓存但没有当前会话，自动创建一个新缓存会话
    const _sessionId = createSession()
  }
})
</script>

<template>
  <div class="flex justify-center items-center">
    <div
      class="h-screen aspect-video flex flex-row relative"
      :class="[showFullScreen ? 'w-full' : 'container 2xl:mx-56 py-[40px] lg:py-[100px]']"
    >
      <ActivityBar
        class="rounded-l-lg rounded-r-none border bg-sidebar"
      />

      <div class="w-full h-full flex flex-col">
        <TopBar
          class="bg-sidebar"
          :class="[showFullScreen ? 'border-b' : 'border-t']"
        />

        <ResizablePanelGroup
          direction="horizontal"
          class="flex-1"
          :class="{ 'border-t border-r border-b': !showFullScreen }"
        >
          <ResizablePanel ref="settingPanelRef" :default-size="20" :min-size="20" collapsible>
            <div class="h-full bg-sidebar">
              <DeviceSetting />
            </div>
          </ResizablePanel>

          <ResizableHandle with-handle />

          <ResizablePanel v-if="!showTerminalMode" :default-size="80">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="70">
                <RecordPanel class="bg-background w-full h-full" />
              </ResizablePanel>
              <ResizableHandle with-handle />
              <ResizablePanel ref="sendPanelRef" :default-size="30" :min-size="30" collapsible>
                <div class="flex flex-col bg-background h-full">
                  <ControlPanel />
                  <SendPanel class="flex-1" />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizablePanel v-else :default-size="80" @resize="onTerminalAreaResize">
            <TerminalPanel ref="terminalPanelRef" />
          </ResizablePanel>
        </ResizablePanelGroup>

        <StatusBar class="bg-sidebar border-r border-b border-t" />
      </div>
      <div
        v-if="showQuickInputPanel && !showTerminalMode"
        class="h-full bg-sidebar max-w-150 w-full border-l"
        :class="[showFullScreen ? '' : 'rounded-r-lg border']"
      >
        <QuickInputPanel />
      </div>
    </div>
  </div>

  <Toaster />
  <DialogProvider />
</template>
