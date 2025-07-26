<script  setup>
import { useLayout } from '@/composables/useLayout'

const { showFullScreen, showSettingPanel, showQuickInputPanel, showSendPanel, fullScreenBreakpoint } = useLayout()

const buttonClass = computed(() => {
  return 'min-w-0 w-8 h-8 p-0 cursor-pointer'
})
</script>

<template>
  <div class="p-2 flex items-center justify-end relative">
    <SearchTool />

    <div class="flex items-center space-x-1">
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

      <TooltipProvider>
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

      <TooltipProvider>
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
