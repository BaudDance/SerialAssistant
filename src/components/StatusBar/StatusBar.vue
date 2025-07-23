<script setup>
import { computed, inject, onBeforeUnmount } from 'vue'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import useOnline from '@/components/UserNumberFooter/useOnline'
import { useRecordStore } from '@/store/useRecordStore'
import { useSendStore } from '@/store/useSendStore'

const { readingRecord, txCount, rxCount } = useRecordStore()
const { online, pause } = useOnline()
onBeforeUnmount(() => {
  // 销毁定时器防止内存泄露
  pause()
})

const serial = inject('serial')
const ble = inject('ble')

const isConnected = computed(() => serial.connected.value || ble.connected.value)
const { isAutoSending } = useSendStore()

const {
  portName,
} = inject('serial')

const {
  deviceName,
} = inject('ble')
</script>

<template>
  <div class="bg-input flex justify-between items-center h-6 pr-3">
    <!-- left -->
    <div class="flex h-full items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            class="h-full flex items-center px-3 text-white" :class="[
              isConnected ? 'bg-green-600' : 'bg-blue-600',
            ]"
          >
            <div v-if="isConnected">
              设备已连接
            </div>
            <div v-else>
              等待连接
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p v-if="isConnected">
              {{ portName || deviceName }} 已连接
            </p>
            <p v-else>
              设备未连接，点击左侧连接按钮连接设备
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div>
        当前有 {{ online.serial }} 位小伙伴正在与你一同调试串口~
      </div>
    </div>
    <!-- right -->
    <div class="flex h-4 items-center space-x-2">
      <div>
        <div v-if="isAutoSending" class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><!-- Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE --><defs><linearGradient id="mingcuteLoadingFill0" x1="50%" x2="50%" y1="5.271%" y2="91.793%"><stop offset="0%" stop-color="currentColor" /><stop offset="100%" stop-color="currentColor" stop-opacity=".55" /></linearGradient><linearGradient id="mingcuteLoadingFill1" x1="50%" x2="50%" y1="15.24%" y2="87.15%"><stop offset="0%" stop-color="currentColor" stop-opacity="0" /><stop offset="100%" stop-color="currentColor" stop-opacity=".55" /></linearGradient></defs><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="url(#mingcuteLoadingFill0)" d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.5 7.5 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021" transform="translate(1.5 1.625)" /><path fill="url(#mingcuteLoadingFill1)" d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.48 10.48 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118" transform="translate(1.5 1.625)" /><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="64;0" /><animateTransform attributeName="transform" dur="2s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></g></svg>
          <span>自动发送中</span>
        </div>
        <div v-else>
          手动发送
        </div>
      </div>
      <Separator orientation="vertical" />
      <div>
        Tx: {{ txCount }} Bytes
      </div>
      <Separator orientation="vertical" />
      <div>
        Rx: {{ rxCount + (readingRecord?.data.length || 0) }} Bytes
      </div>
    </div>
  </div>
</template>
