<script setup>
import { defineAsyncComponent, provide, ref, watchEffect } from 'vue'
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
import { useSerial } from '@/composables/useSerial'
import { listenNetworkStatus } from '@/network'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'
import 'vue-sonner/style.css'

const DialogProvider = defineAsyncComponent(() => import('@/components/Dialog/Provider.vue'))

const { readingRecord, addRecord } = useRecordStore()
const { readType } = useSerialStore()
const { showFullScreen, fullScreenBreakpoint, showSettingPanel, showSendPanel } = useLayout()
const settingPanelRef = ref()
const sendPanelRef = ref()
watchEffect(() => {
  if (showSettingPanel.value) {
    settingPanelRef.value?.expand()
  }
  else {
    settingPanelRef.value?.collapse()
  }
})
watchEffect(() => {
  if (showSendPanel.value) {
    sendPanelRef.value?.expand()
  }
  else {
    sendPanelRef.value?.collapse()
  }
})
listenNetworkStatus()

// 保存用户在大屏幕下的全屏偏好
const userFullScreenPreference = ref(showFullScreen.value)

watchEffect(() => {
  if (fullScreenBreakpoint.value) {
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
})

// 监听用户主动切换全屏状态（仅在大屏幕时更新偏好）
watchEffect(() => {
  if (!fullScreenBreakpoint.value) {
    userFullScreenPreference.value = showFullScreen.value
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
        <TopBar class="bg-sidebar rounded-tr-lg border-t border-r" />
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
          <ResizablePanel :default-size="80">
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
        </ResizablePanelGroup>
        <StatusBar class="bg-sidebar rounded-br-lg border-r border-b" />
      </div>
      <!-- <div class="text-sm m-2 absolute bottom-[15px] lg:bottom-[75px] right-0">
        powered by 波特律动
      </div> -->
    </div>
  </div>

  <Toaster />
  <DialogProvider />
</template>
