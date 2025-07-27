<script setup>
import { useDark, useToggle } from '@vueuse/core'
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDialog } from '@/components/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useLayout } from '@/composables/useLayout'

const { open } = useDialog()
const router = useRouter()

// 注入串口和蓝牙连接状态
const serial = inject('serial')
const ble = inject('ble')

// 计算设备是否已连接
const isConnected = computed(() => serial.connected.value || ble.connected.value)

// Alert Dialog 状态
const showRecordAlert = ref(false)

const isDark = useDark()
const toggleDark = useToggle(isDark)
const { fullScreenBreakpoint } = useLayout()

const buttonClass = computed(() => {
  if (fullScreenBreakpoint.value) {
    return 'w-6 h-6 p-0.75'
  }
  return 'w-12 h-12 p-3'
})

// 处理会话历史按钮点击
function handleRecordClick() {
  if (isConnected.value) {
    // 如果有设备连接，显示确认对话框
    showRecordAlert.value = true
  }
  else {
    // 如果没有设备连接，直接导航
    router.push('/record')
  }
}

// 确认在新标签页打开会话历史
function confirmOpenRecord() {
  const url = router.resolve('/record').href
  window.open(url, '_blank')
  showRecordAlert.value = false
}

// 取消操作
function cancelOpenRecord() {
  showRecordAlert.value = false
}
</script>

<template>
  <div class="bg-input flex flex-col h-full p-2 justify-between">
    <div class="flex items-center flex-col space-y-1">
      <!-- GitHub -->
      <a href="https://github.com/BaudDance/SerialAssistant" target="_blank">
        <Button as-child variant="ghost" size="icon" :class="buttonClass">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Design Icons by Pictogrammers - https://github.com/Templarian/MaterialDesign/blob/master/LICENSE --><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" /></svg>
        </Button>
      </a>

      <!-- Bilibili -->
      <a href="https://space.bilibili.com/6100925" target="_blank">
        <Button as-child variant="ghost" size="icon" :class="buttonClass">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zm5-7l2 3m6-3l-2 3m-5 7v-2m6 0v2" /></svg>
        </Button>
      </a>
    </div>
    <div class="flex flex-col items-center space-y-1">
      <!-- 会话历史 -->
      <Button as-child variant="ghost" size="icon" class="cursor-pointer" :class="buttonClass" @click="handleRecordClick">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 21q-3.15 0-5.575-1.912T3.275 14.2q-.1-.375.15-.687t.675-.363q.4-.05.725.15t.45.6q.6 2.25 2.475 3.675T12 19q2.925 0 4.963-2.037T19 12t-2.037-4.962T12 5q-1.725 0-3.225.8T6.25 8H8q.425 0 .713.288T9 9t-.288.713T8 10H4q-.425 0-.712-.288T3 9V5q0-.425.288-.712T4 4t.713.288T5 5v1.35q1.275-1.6 3.113-2.475T12 3q1.875 0 3.513.713t2.85 1.924t1.925 2.85T21 12t-.712 3.513t-1.925 2.85t-2.85 1.925T12 21m1-9.4l2.5 2.5q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-2.8-2.8q-.15-.15-.225-.337T11 11.975V8q0-.425.288-.712T12 7t.713.288T13 8z" /></svg>
      </Button>

      <!-- 暗色/亮色 -->
      <Button as-child variant="ghost" size="icon" class="cursor-pointer" :class="[buttonClass]" @click="() => toggleDark()">
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21" /></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12t-1.463 3.538T12 17m-7-4H1v-2h4zm18 0h-4v-2h4zM11 5V1h2v4zm0 18v-4h2v4zM6.4 7.75L3.875 5.325L5.3 3.85l2.4 2.5zm12.3 12.4l-2.425-2.525L17.6 16.25l2.525 2.425zM16.25 6.4l2.425-2.525L20.15 5.3l-2.5 2.4zM3.85 18.7l2.525-2.425L7.75 17.6l-2.425 2.525z" /></svg>
      </Button>

      <!-- 菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button as-child variant="ghost" size="icon" class="cursor-pointer" :class="buttonClass">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Icon from Game Icons by GameIcons - https://github.com/game-icons/icons/blob/master/license.txt --><path fill="currentColor" d="M32 96v64h448V96zm0 128v64h448v-64zm0 128v64h448v-64z" /></svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56 select-none">
          <DropdownMenuLabel>小工具</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem class="cursor-pointer" @select="open('downLoadDriver')">
              <span>
                常见驱动下载
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer" @select="open('ascii')">
              <span>
                ASCII码表
              </span>
            </DropdownMenuItem>
            <a href="https://led.baud-dance.com/" target="_blank">
              <DropdownMenuItem class="cursor-pointer">
                LED字模生成器
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M15.729 3.884c1.434-1.44 3.532-1.47 4.693-.304c1.164 1.168 1.133 3.28-.303 4.72l-2.423 2.433a.75.75 0 0 0 1.062 1.059l2.424-2.433c1.911-1.919 2.151-4.982.303-6.838c-1.85-1.857-4.907-1.615-6.82.304L9.819 7.692c-1.911 1.919-2.151 4.982-.303 6.837a.75.75 0 1 0 1.063-1.058c-1.164-1.168-1.132-3.28.303-4.72z" /><path fill="currentColor" d="M14.485 9.47a.75.75 0 0 0-1.063 1.06c1.164 1.168 1.133 3.279-.303 4.72l-4.847 4.866c-1.435 1.44-3.533 1.47-4.694.304c-1.164-1.168-1.132-3.28.303-4.72l2.424-2.433a.75.75 0 0 0-1.063-1.059l-2.424 2.433c-1.911 1.92-2.151 4.982-.303 6.838c1.85 1.858 4.907 1.615 6.82-.304l4.847-4.867c1.911-1.918 2.151-4.982.303-6.837" /></svg>
              </DropdownMenuItem>
            </a>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 设置 -->
      <Button as-child variant="ghost" size="icon" class="cursor-pointer" :class="buttonClass" @click="open('setting')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5" /></svg>
      </Button>
    </div>

    <!-- Alert Dialog for Record Navigation -->
    <AlertDialog v-model:open="showRecordAlert">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>设备已连接</AlertDialogTitle>
          <AlertDialogDescription>
            检测到设备已连接，继续前往会话历史将在新标签页打开，以避免中断当前连接。是否继续？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="cursor-pointer" @click="cancelOpenRecord">
            取消
          </AlertDialogCancel>
          <AlertDialogAction class="cursor-pointer" @click="confirmOpenRecord">
            继续
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
