<script setup>
import { useSendStore } from '@/store/useSendStore'
import AutoSendButton from './components/AutoSendButton.vue'

const { sendData, clear, onInput, send, sendType, checkAlgorithm, checkAlgorithms, checkDigitHexFormat, reformat, isAutoSending } = useSendStore()
</script>

<template>
  <div class="flex flex-col h-full">
    <textarea
      id="send-panel-input"
      v-model="sendData"
      type="text-area"
      class="flex-1 w-full bg-transparent focus:outline-none focus-visible:outline-none text-sm pt-1 px-3 pb-3"
      autocomplete="send-panel-input"
      @input="onInput"
    />

    <div class="p-3  flex justify-end space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button as-child variant="ghost" class="w-9 h-9 cursor-pointer p-1.5" @click="reformat">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M11 22q-.825 0-1.412-.587T9 20v-4H6q-.825 0-1.412-.587T4 14V7q0-1.65 1.175-2.825T8 3h12v11q0 .825-.587 1.413T18 16h-3v4q0 .825-.587 1.413T13 22zM6 10h12V5h-1v4h-2V5h-1v2h-2V5H8q-.825 0-1.412.588T6 7zm0 4h12v-2H6zm0 0v-2z" /></svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>点击整理发送格式</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger as-child class="cursor-pointer">
          <Button variant="ghost">
            {{
              checkAlgorithm
                ? `${checkAlgorithm}(${checkDigitHexFormat})`
                : "校验位"
            }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top">
          <DropdownMenuLabel>末尾添加校验位</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup v-model="checkAlgorithm">
            <DropdownMenuRadioItem v-for="(item, index) in checkAlgorithms" :key="index" :value="item.name">
              {{ item.name }}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="">
              不校验
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AutoSendButton />

      <Button :disabled="sendData.length === 0 || isAutoSending" :class="[sendData.length === 0 ? '' : 'cursor-pointer']" @click="send">
        发送
      </Button>
    </div>
  </div>
</template>
