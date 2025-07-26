<script setup>
import { useSettingStore } from '@/store/useSettingStore.js'

const { deviceType } = useSettingStore()
</script>

<template>
  <div class="w-full h-full flex items-center justify-center flex-col space-y-4">
    <div class="w-16 h-16">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><!-- Icon from Remix Icon by Remix Design - https://github.com/Remix-Design/RemixIcon/blob/master/License --><path fill="currentColor" d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m1 2v14h16V5zm8 10h6v2h-6zm-3.333-3L5.838 9.172l1.415-1.415L11.495 12l-4.242 4.243l-1.415-1.415z" /></svg>
    </div>
    <h1 class="text-2xl font-bold">
      欢迎使用终端模式
    </h1>
    <p class=" text-gray-500">
      请先在左侧设备面板中连接{{ deviceType === 'serial' ? '串口设备' : '蓝牙设备' }}以进入终端交互
    </p>
    <p class=" text-gray-500 text-sm">
      您可以直接与支持终端交互的设备，例如Linux系统的终端、RT-Thread系统的终端（FinSH）进行交互。
    </p>
    <Alert class="max-w-md mt-10">
      <AlertTitle>注意：终端模式是实验特性，不建议在生产环境中使用。</AlertTitle>
    </Alert>
  </div>
</template>
