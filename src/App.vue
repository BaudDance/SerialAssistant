<script setup>
import { provide } from 'vue'
import { SiderBar } from '@/components'
import ControlPanel from '@/components/ControlPanel/ControlPanel.vue'
// import ASCIIModel from './modals/AsciiModel/ASCIIModel.vue'
import { DownLoadDriverDialog } from '@/components/Dialog'
import RecordPanel from '@/components/RecordPanel/RecordPanel.vue'
import SendPanel from '@/components/SendPanel/SendPanel.vue'
import DeviceSetting from '@/components/SettingPanel/DeviceSetting.vue'
// import DownloadDriverModal from '@/modals/DownloadDriverModal/DownloadDriverModal.vue'
// import SerialRateModal from '@/modals/SerialRateModal/SerialRateModal.vue'
// import SettingModal from '@/modals/SettingModal/SettingModal.vue'
import { listenNetworkStatus } from '@/network'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'
import { useBle } from '@/utils/useBle'
import { useSerial } from '@/utils/useSerial'
import UserNumberFotter from './components/UserNumberFooter/UserNumberFotter.vue'

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
    <div class="container 2xl:mx-56 aspect-video h-screen py-[40px] lg:py-[100px] flex flex-col-reverse space-y-5 lg:space-y-0 lg:flex-row relative">
      <SiderBar />
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
      <UserNumberFotter class="absolute  bottom-[15px] lg:bottom-[75px] left-0 m-2" />
    </div>
  </div>
  <!-- <DownloadDriverModal />
  <SettingModal />
  <ASCIIModel />
  <SerialRateModal /> -->
  <DownLoadDriverDialog />
</template>
