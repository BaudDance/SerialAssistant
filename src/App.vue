<script setup>
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { defineAsyncComponent, provide } from 'vue'

import ActivityBar from '@/components/ActivityBar/ActivityBar.vue'
import ControlPanel from '@/components/ControlPanel/ControlPanel.vue'
import RecordPanel from '@/components/RecordPanel/RecordPanel.vue'
import SendPanel from '@/components/SendPanel/SendPanel.vue'
import DeviceSetting from '@/components/SettingPanel/DeviceSetting.vue'
import StatusBar from '@/components/StatusBar/StatusBar.vue'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

import { useBle } from '@/composables/useBle'
import { useFullScreen } from '@/composables/useFullScreen'
import { useSerial } from '@/composables/useSerial'
import { listenNetworkStatus } from '@/network'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'

const AsciiDialog = defineAsyncComponent(() => import('@/components/Dialog/Ascii.vue'))
const DownLoadDriverDialog = defineAsyncComponent(() => import('@/components/Dialog/DownLoadDriver.vue'))
const SettingDialog = defineAsyncComponent(() => import('@/components/Dialog/Setting.vue'))
const SerialRateDialog = defineAsyncComponent(() => import('@/components/Dialog/SerialRate.vue'))

const { readingRecord, addRecord } = useRecordStore()
const { readType } = useSerialStore()
const { isFullScreen } = useFullScreen()

listenNetworkStatus()

const breakpoints = useBreakpoints(breakpointsTailwind)

const lgAndLarger = breakpoints.greaterOrEqual('lg') // lg and larger

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
      class="h-screen aspect-video flex flex-col lg:flex-row relative"
      :class="[isFullScreen ? 'w-full' : 'container 2xl:mx-56 py-[40px] lg:py-[100px]']"
    >
      <ActivityBar
        :class="{ 'rounded-t-lg rounded-b-none border-r border-l border-b lg:rounded-l-lg lg:rounded-r-none lg:border-t lg:border-l lg:border-b': !isFullScreen }"
      />
      <ResizablePanelGroup
        v-if="lgAndLarger"
        direction="horizontal"
        :class="{ 'rounded-r-lg border-t border-r border-b': !isFullScreen }"
      >
        <ResizablePanel :default-size="20">
          <div class=" h-full bg-card ">
            <DeviceSetting />
          </div>
        </ResizablePanel>
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="80">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel :default-size="70">
              <RecordPanel class="bg-card w-full h-full" />
            </ResizablePanel>
            <ResizableHandle with-handle />
            <ResizablePanel :default-size="30">
              <div class="flex flex-col bg-card h-full">
                <ControlPanel class="" />
                <SendPanel class="flex-1" />
                <StatusBar class="bg-input" />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ResizablePanelGroup
        v-else
        direction="vertical"
        :class="{ 'rounded-b-lg border-l border-r border-b': !isFullScreen }"
      >
        <ResizablePanel :default-size="70">
          <ResizablePanelGroup
            direction="horizontal"
          >
            <ResizablePanel :default-size="20">
              <div class=" h-full bg-card ">
                <DeviceSetting />
              </div>
            </ResizablePanel>
            <ResizableHandle with-handle />
            <ResizablePanel :default-size="80">
              <RecordPanel class="bg-card w-full h-full" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="30">
          <div class="flex flex-col bg-card h-full">
            <ControlPanel class="" />
            <SendPanel class="flex-1" />
            <StatusBar class="bg-input" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <!-- <div class="text-sm m-2 absolute bottom-[15px] lg:bottom-[75px] right-0">
        powered by 波特律动
      </div> -->
    </div>
  </div>

  <AsciiDialog />
  <DownLoadDriverDialog />
  <SettingDialog />
  <SerialRateDialog />
</template>
