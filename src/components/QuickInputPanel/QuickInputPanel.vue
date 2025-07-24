<script setup>
import { useLocalStorage } from '@vueuse/core'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import draggable from 'vuedraggable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSendStore } from '@/store/useSendStore'
import { useSerialStore } from '@/store/useSerialStore'

const { send, sendData } = useSendStore()
const { sendType } = useSerialStore()

// 获取串口和蓝牙连接状态
const serial = inject('serial')
const ble = inject('ble')

// 计算设备是否已连接
const isConnected = computed(() => serial.connected.value || ble.connected.value)

// 确认对话框状态
const showClearConfirm = ref(false)
const showResetConfirm = ref(false)

// 循环发送状态
const isLoopSending = ref(false)
const loopInterval = ref(5000) // 默认循环间隔5秒
const loopTimer = ref(null)

// 默认快捷输入数据
const defaultQuickInputs = [
  { id: 1, enabled: true, content: 'AT+RST', index: 1, delay: 1000, isHex: false },
  { id: 2, enabled: true, content: 'AT+GMR', index: 2, delay: 1000, isHex: false },
  { id: 3, enabled: true, content: 'AT+CWLAP', index: 3, delay: 1000, isHex: false },
  { id: 4, enabled: false, content: '01 02 03 04', index: 4, delay: 1000, isHex: true },
  { id: 5, enabled: false, content: 'AT+CWJAP="SSID","PASSWORD"', index: 5, delay: 1000, isHex: false },
]

// 使用本地存储保存快捷输入数据
const quickInputs = useLocalStorage('quickInputs', defaultQuickInputs)

// 新增一行
function addRow() {
  const newId = quickInputs.value.length > 0
    ? Math.max(...quickInputs.value.map(item => item.id)) + 1
    : 1
  quickInputs.value.push({
    id: newId,
    enabled: false,
    content: '',
    index: quickInputs.value.length + 1,
    delay: 1000,
    isHex: sendType.value === 'hex',
  })
  updateIndexes()
}

// 删除一行
function deleteRow(id) {
  const index = quickInputs.value.findIndex(item => item.id === id)
  if (index !== -1) {
    quickInputs.value.splice(index, 1)
    updateIndexes()
  }
}

// 更新索引
function updateIndexes() {
  quickInputs.value.forEach((item, index) => {
    item.index = index + 1
  })
}

// 全部启用
function enableAll() {
  quickInputs.value.forEach((item) => {
    item.enabled = true
  })
}

// 全部禁用
function disableAll() {
  quickInputs.value.forEach((item) => {
    item.enabled = false
  })
}

// 清空所有数据
function clearAll() {
  showClearConfirm.value = true
}

// 执行清空操作
function confirmClear() {
  quickInputs.value = []
  updateIndexes()
  showClearConfirm.value = false
}

// 重置为默认配置
function resetToDefault() {
  showResetConfirm.value = true
}

// 执行重置操作
function confirmReset() {
  quickInputs.value = JSON.parse(JSON.stringify(defaultQuickInputs))
  updateIndexes()
  showResetConfirm.value = false
}

// 导出配置
function exportConfig() {
  const data = JSON.stringify(quickInputs.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quick-inputs-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入配置
function importConfig() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (Array.isArray(data)) {
            quickInputs.value = data
            updateIndexes()
          }
          else {
            toast.error('导入的文件格式不正确')
          }
        }
        catch (error) {
          toast.error(`导入失败：${error.message}`)
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 发送数据
async function sendItem(item) {
  if (!item.content)
    return

  // 临时保存当前发送类型和发送数据
  const currentSendType = sendType.value
  const currentSendData = sendData.value

  try {
    // 根据项目的isHex设置发送类型
    if (item.isHex && sendType.value !== 'hex') {
      sendType.value = 'hex'
    }
    else if (!item.isHex && sendType.value === 'hex') {
      sendType.value = 'ascii'
    }

    // 设置发送数据并发送
    sendData.value = item.content
    await send()
  }
  catch (error) {
    console.error('发送数据失败:', error)
  }
  finally {
    // 恢复原来的发送类型和发送数据
    sendType.value = currentSendType
    sendData.value = currentSendData
  }
}

// 发送所有选中的数据
async function sendAllEnabled() {
  const enabledItems = quickInputs.value.filter(item => item.enabled)
  if (enabledItems.length === 0)
    return

  // 按顺序发送所有选中的数据
  for (const item of enabledItems) {
    // 如果循环发送已被取消，立即停止发送剩余项目
    if (!isLoopSending.value && loopTimer.value === null)
      break

    await sendItem(item)

    // 如果有延时，则等待指定时间
    if (item.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, item.delay))
    }

    // 再次检查循环发送状态，如果已取消则停止
    if (!isLoopSending.value && loopTimer.value === null)
      break
  }
}

// 开始循环发送
function startLoopSending() {
  if (isLoopSending.value)
    return

  const enabledItems = quickInputs.value.filter(item => item.enabled)
  if (enabledItems.length === 0) {
    toast.error('没有启用的快捷输入项')
    return
  }

  // 确保状态重置
  if (loopTimer.value) {
    clearInterval(loopTimer.value)
  }

  isLoopSending.value = true
  sendAllEnabled()

  loopTimer.value = setInterval(() => {
    // 只有在循环发送状态为true时才继续发送
    if (isLoopSending.value) {
      sendAllEnabled()
    }
    else {
      // 如果状态已变更，清除定时器
      clearInterval(loopTimer.value)
      loopTimer.value = null
    }
  }, loopInterval.value)
}

// 停止循环发送
function stopLoopSending() {
  if (!isLoopSending.value)
    return

  // 先更新状态，这样正在进行的 sendAllEnabled 会检测到状态变化并中断
  isLoopSending.value = false

  // 然后清除定时器
  if (loopTimer.value) {
    clearInterval(loopTimer.value)
    loopTimer.value = null
  }

  // 可以添加提示信息
  toast.info('已停止循环发送')
}

// 组件挂载和卸载时的处理
onMounted(() => {
  updateIndexes()
})

onUnmounted(() => {
  stopLoopSending()
})
</script>

<template>
  <div class="p-2 h-full flex flex-col">
    <div class="flex flex-col space-y-3 mb-3">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-semibold leading-none tracking-tight">
          快捷输入面板
        </h3>
        <div class="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="addRow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                    <line x1="12" x2="12" y1="5" y2="19" />
                    <line x1="5" x2="19" y1="12" y2="12" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>新增</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600" @click="clearAll">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清空</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="enableAll">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>全部启用</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="disableAll">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>全部禁用</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="importConfig">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>导入配置</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="exportConfig">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>导出配置</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer" @click="resetToDefault">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>重置为默认配置</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 w-full h-9">
        <Button
          variant="default"
          size="sm"
          class="flex items-center justify-center gap-1 h-full cursor-pointer"
          :disabled="!isConnected || isLoopSending"
          :title="!isConnected ? '请先连接设备' : (isLoopSending ? '循环发送中，无法发送选中' : '发送选中')"
          @click="sendAllEnabled"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-horizontal">
            <path d="m3 3 3 9-3 9 19-9Z" />
            <path d="M6 12h16" />
          </svg>
          <span>发送选中</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          class="flex items-center justify-center gap-1 h-full cursor-pointer"
          :class="{ 'bg-red-500 hover:bg-red-600': isLoopSending }"
          :disabled="!isConnected"
          :title="!isConnected ? '请先连接设备' : ''"
          @click="isLoopSending ? stopLoopSending() : startLoopSending()"
        >
          <svg v-if="!isLoopSending" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-repeat">
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square">
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
          <span>{{ isLoopSending ? '停止循环' : '循环发送' }}</span>
        </Button>

        <div class="flex items-center justify-center gap-2 h-full">
          <span class="text-xs whitespace-nowrap">循环间隔:</span>
          <Input
            v-model="loopInterval"
            type="number"
            min="1000"
            step="1000"
            class="text-center w-20 disable-spin-button"
            :disabled="isLoopSending"
          />
          <span class="text-xs whitespace-nowrap">ms</span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px] text-center">
              启用
            </TableHead>
            <TableHead class="text-center">
              内容
            </TableHead>
            <TableHead class="w-[60px] text-center">
              HEX
            </TableHead>
            <TableHead class="w-[80px] text-center">
              延时(ms)
            </TableHead>
            <TableHead class="w-[100px] text-center">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <draggable
          v-model="quickInputs"
          tag="tbody"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-50"
          :animation="150"
          @end="updateIndexes"
        >
          <template #item="{ element: item }">
            <TableRow class="group">
              <TableCell class="text-center">
                <Checkbox v-model="item.enabled" class="cursor-pointer" />
              </TableCell>
              <TableCell>
                <div class="flex items-center">
                  <div class="drag-handle cursor-move mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical">
                      <circle cx="9" cy="5" r="1" />
                      <circle cx="9" cy="12" r="1" />
                      <circle cx="9" cy="19" r="1" />
                      <circle cx="15" cy="5" r="1" />
                      <circle cx="15" cy="12" r="1" />
                      <circle cx="15" cy="19" r="1" />
                    </svg>
                  </div>
                  <Input
                    v-model="item.content"
                    placeholder="请输入内容"
                    class="w-full"
                  />
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Checkbox v-model="item.isHex" class="cursor-pointer" />
              </TableCell>
              <TableCell>
                <Input
                  v-model="item.delay"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full text-center disable-spin-button"
                />
              </TableCell>
              <TableCell>
                <div class="flex justify-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="!item.enabled"
                    :class="[!item.enabled ? 'cursor-not-allowed' : 'cursor-pointer']"
                    @click="sendItem(item)"
                  >
                    发送
                  </Button>
                  <Button variant="outline" size="sm" class="cursor-pointer" @click="deleteRow(item.id)">
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <template v-if="quickInputs.length === 0" #footer>
            <TableRow>
              <TableCell colspan="5" class="py-6 text-center text-muted-foreground">
                暂无快捷输入项，点击"新增"按钮添加
              </TableCell>
            </TableRow>
          </template>
        </draggable>
      </Table>
    </div>
  </div>

  <!-- 清空确认对话框 -->
  <AlertDialog v-model:open="showClearConfirm">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认清空</AlertDialogTitle>
        <AlertDialogDescription>
          确定要清空所有快捷输入项吗？
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmClear">
          确认
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 重置确认对话框 -->
  <AlertDialog v-model:open="showResetConfirm">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认重置</AlertDialogTitle>
        <AlertDialogDescription>
          确定要重置快捷输入为默认配置吗？这将覆盖快捷输入当前所有设置。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmReset">
          确认
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
