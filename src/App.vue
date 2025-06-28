<script setup>
import { defineAsyncComponent, provide } from 'vue'
import { ActivityBar, StatusBar } from '@/components'
import ControlPanel from '@/components/ControlPanel/ControlPanel.vue'
import RecordPanel from '@/components/RecordPanel/RecordPanel.vue'
import SendPanel from '@/components/SendPanel/SendPanel.vue'
import DeviceSetting from '@/components/SettingPanel/DeviceSetting.vue'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

import { useBle } from '@/composables/useBle'
import { useSerial } from '@/composables/useSerial'
import { listenNetworkStatus } from '@/network'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'

const AsciiDialog = defineAsyncComponent(() => import('@/components/Dialog/Ascii.vue'))
const DownLoadDriverDialog = defineAsyncComponent(() => import('@/components/Dialog/DownLoadDriver.vue'))
const SettingDialog = defineAsyncComponent(() => import('@/components/Dialog/Setting.vue'))

const { readingRecord, addRecord } = useRecordStore()
const { readType } = useSerialStore()

listenNetworkStatus()

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
    <div class="container 2xl:mx-56 aspect-video h-screen py-[40px] lg:py-[100px] flex flex-col-reverse  lg:flex-row relative">
      <ActivityBar class="rounded-l-lg border-t border-l border-b" />
      <ResizablePanelGroup
        direction="horizontal"
        class="rounded-r-lg border-t border-r border-b"
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
      <!-- <SiderBar />
      <DeviceSetting class="lg:basis-1/4 border-solid border-2 border-gray-400  p-5" />
      <div class="w-7" />
      <div class="flex flex-col flex-1 lg:basis-3/4 space-y-2">
        <RecordPanel class="flex-1 lg:basis-3/4 border-solid border-2 border-gray-400 " />
        <ControlPanel />
        <SendPanel class="lg:basis-1/4 border-solid border-2 border-gray-400 " />
      </div>

      <div class="text-sm m-2 absolute bottom-[15px] lg:bottom-[75px] right-0">
        powered by 波特律动
      </div>
      <UserNumberFotter class="absolute  bottom-[15px] lg:bottom-[75px] left-0 m-2" /> -->
    </div>
  </div>
  <!-- <DownloadDriverModal />
  <SettingModal />
  <ASCIIModel />
  <SerialRateModal /> -->
  <AsciiDialog />
  <DownLoadDriverDialog />
  <SettingDialog />
</template>
