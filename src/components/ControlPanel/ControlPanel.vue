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
  ascii: 'border-yellow-600 text-yellow-600',
  hex: 'border-cyan-600 text-cyan-600',
  error: 'border-[var(--destructive)] text-[var(--destructive)]',
}
</script>

<template>
  <div class="flex items-center px-3 space-x-3 py-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge class="cursor-pointer" :class="[typeCssMap[readType]]" variant="outline" @click="toggleReadType">
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
          <Badge class="cursor-pointer" :class="[typeCssMap[sendType]]" variant="outline" @click="toggleSendType">
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
            {{ pinBottom ? '自动滚动' : '锁定滚动' }}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M16.4 21L15 19.6l2.1-2.1l-2.1-2.1l1.4-1.4l2.1 2.1l2.1-2.1l1.4 1.4l-2.075 2.1L22 19.6L20.6 21l-2.1-2.075zM12 21q-3.45 0-6.012-2.287T3.05 13H5.1q.35 2.6 2.313 4.3T12 19q.275 0 .513-.012t.487-.063v2.025q-.25.025-.488.038T12 21M3 10V4h2v2.35q1.275-1.6 3.113-2.475T12 3q3.75 0 6.375 2.625T21 12h-2q0-2.925-2.037-4.962T12 5q-1.725 0-3.225.8T6.25 8H9v2zm10.35 4.75L11 12.4V7h2v4.6l1.4 1.4z" /></svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M11 16h2v-4.15l1.6 1.55L16 12l-4-4l-4 4l1.4 1.4l1.6-1.55zm-4 5q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM7 6v13z" /></svg>  清空发送
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>点击清除发送窗口消息</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
