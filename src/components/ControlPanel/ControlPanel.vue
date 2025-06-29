<script setup>
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRecordStore } from '@/store/useRecordStore'
import { useSendStore } from '@/store/useSendStore'
import { useSerialStore } from '@/store/useSerialStore'

const { readType, sendType, nextReadType, nextSendType } = useSerialStore()
const { pinBottom, clearRecords, readingRecord, rxCount, txCount } = useRecordStore()
const { clear } = useSendStore()

function toggleReadType() {
  nextReadType()
}

function toggleSendType() {
  nextSendType()
}
function togglePinBottom() {
  pinBottom.value = !pinBottom.value
}
const typeCssMap = {
  ascii: 'badge-warning',
  hex: 'badge-info',
  error: 'badge-error',
}
</script>

<template>
  <div class="flex items-center px-3 space-x-3 py-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" @click="toggleReadType">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 16.175l3.9-3.875q.275-.275.688-.288t.712.288q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213l-4.6-4.6q-.275-.275-.288-.687T6.7 12.3q.275-.275.7-.275t.7.275zm0-6L15.9 6.3q.275-.275.688-.287t.712.287q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062t-.375-.062t-.325-.213L6.7 7.7q-.275-.275-.288-.687T6.7 6.3q.275-.275.7-.275t.7.275z" /></svg>
            接收:{{ readType.toUpperCase() }}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击切换接收格式</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" @click="toggleSendType">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 13.825L8.1 17.7q-.275.275-.687.288T6.7 17.7q-.275-.275-.275-.7t.275-.7l4.6-4.6q.15-.15.325-.213t.375-.062t.375.062t.325.213l4.6 4.6q.275.275.288.688t-.288.712q-.275.275-.7.275t-.7-.275zm0-6L8.1 11.7q-.275.275-.687.288T6.7 11.7q-.275-.275-.275-.7t.275-.7l4.6-4.6q.15-.15.325-.212T12 5.425t.375.063t.325.212l4.6 4.6q.275.275.288.688t-.288.712q-.275.275-.7.275t-.7-.275z" /></svg>
            发送:{{ sendType.toUpperCase() }}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击切换发送格式</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" @click="togglePinBottom">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from css.gg by Astrit - https://github.com/astrit/css.gg/blob/master/LICENSE --><g fill="currentColor"><path d="m9.172 16.818l-1.415 1.414L12 22.475l4.243-4.243l-1.415-1.414L12 19.647zm5.656-9.636l1.415-1.414L12 1.525L7.757 5.768l1.415 1.414L12 4.354z" /><path fill-rule="evenodd" d="M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0 2a1 1 0 1 1 0 2a1 1 0 0 1 0-2" clip-rule="evenodd" /></g></svg>
            {{ pinBottom ? '自动滚动' : '不滚动' }}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击切换接收窗口是否自动滚动</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <div class="flex-1" />

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" @click="clearRecords">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z" /></svg>
            清空接收
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击清除接收窗口消息</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" @click="() => clear()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z" /></svg>
            清空发送
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击清除发送窗口消息</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
