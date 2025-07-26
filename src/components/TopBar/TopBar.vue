<script  setup>
import { useLayout } from '@/composables/useLayout'

const { showFullScreen, showTerminalMode, showSettingPanel, showQuickInputPanel, showSendPanel, fullScreenBreakpoint, toggleTerminalMode } = useLayout()

const buttonClass = computed(() => {
  return 'min-w-0 w-8 h-8 p-0 cursor-pointer'
})
</script>

<template>
  <div class="p-2 flex items-center justify-end relative">
    <SearchTool v-if="!showTerminalMode" />

    <div class="flex items-center space-x-1 relative">
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Remix Icon by Remix Design - https://github.com/Remix-Design/RemixIcon/blob/master/License --><path fill="currentColor" d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m1 2v14h16V5zm8 10h6v2h-6zm-3.333-3L5.838 9.172l1.415-1.415L11.495 12l-4.242 4.243l-1.415-1.415z" /></svg>
            Terminal Mode
          </Button>
          <Separator orientation="vertical" />
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-4">
              <h4 class="font-medium leading-none">
                终端模式（实验性）
              </h4>
              <p class="text-sm text-muted-foreground">
                终端模式下，你可以直接在Web通过串口或蓝牙直接与支持shell交互的设备进行命令行交互。
              </p>
              <Separator />
              <p class="text-sm text-muted-foreground">
                终端模式下，你不能再使用记录面板。
              </p>
              <p class="text-sm text-muted-foreground">
                终端模式下，你不能再使用发送面板，也不能再使用校验位、自动格式化、自动发送等功能。同时将禁用展开/折叠输入面板按钮。
              </p>
              <p class="text-sm text-muted-foreground">
                终端模式下，你不能再使用快捷发送面板。同时将禁用展开/折叠快速输入面板按钮。
              </p>
            </div>
            <Separator />
            <Button class="cursor-pointer" @click="toggleTerminalMode">
              <span>{{ showTerminalMode ? '退出终端模式' : '进入终端模式' }}</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Toggle v-model="showSettingPanel" :class="[buttonClass]">
              <svg v-if="showSettingPanel" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM18 5h-8v14h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm5-2v16" /></svg>
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>点击{{ showSettingPanel ? '折叠' : '展开' }}设备设置面板</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider v-if="!showTerminalMode">
        <Tooltip>
          <TooltipTrigger>
            <Toggle v-model="showSendPanel" :class="[buttonClass]">
              <svg v-if="showSendPanel" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M18 3a3 3 0 0 1 2.995 2.824L21 6v12a3 3 0 0 1-2.824 2.995L18 21H6a3 3 0 0 1-2.995-2.824L3 18V6a3 3 0 0 1 2.824-2.995L6 3zm0 2H6a1 1 0 0 0-.993.883L5 6v9h14V6a1 1 0 0 0-.883-.993z" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 9h16" /></svg>
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>点击{{ showSendPanel ? '折叠' : '展开' }}输入面板</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider v-if="!showTerminalMode">
        <Tooltip>
          <TooltipTrigger>
            <Toggle v-model="showQuickInputPanel" :class="[buttonClass]">
              <svg v-if="showQuickInputPanel" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M6 21a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zm8-16H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8z" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm11-2v16" /></svg>
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>点击{{ showQuickInputPanel ? '折叠' : '展开' }}快捷输入面板</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider v-if="!fullScreenBreakpoint">
        <Tooltip>
          <TooltipTrigger>
            <Toggle v-model="showFullScreen" :class="[buttonClass]">
              <svg v-if="showFullScreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M6 21v-3H3v-2h5v5zm10 0v-5h5v2h-3v3zM3 8V6h3V3h2v5zm13 0V3h2v3h3v2z" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M3 21v-5h2v3h3v2zm13 0v-2h3v-3h2v5zM3 8V3h5v2H5v3zm16 0V5h-3V3h5v5z" /></svg>
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>点击{{ showFullScreen ? '退出全尺寸' : '全尺寸' }}显示工作窗口</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
