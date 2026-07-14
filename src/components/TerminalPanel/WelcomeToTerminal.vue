<script setup>
import { useSettingStore } from '@/store/useSettingStore.js'

const { deviceType } = useSettingStore()
</script>

<template>
  <div class="w-full h-full flex items-center justify-center flex-col space-y-4">
    <div class="relative size-16">
      <img
        src="/串口助手_64.png"
        alt=""
        aria-hidden="true"
        class="size-16 rounded-2xl shadow-sm select-none"
        draggable="false"
      >
      <div class="absolute -right-1 -bottom-1 h-7 min-w-10 rounded-md border bg-background px-2 font-mono text-sm font-semibold leading-7 shadow-sm">
        &gt;_
      </div>
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
