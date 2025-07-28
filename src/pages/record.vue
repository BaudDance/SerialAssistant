<script setup>
import { useTitle } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useRecordCache } from '@/composables/useRecordCache'
import { useRecordStore } from '@/store/useRecordStore'

defineOptions({
  name: 'RecordPage',
})

useTitle('会话记录')

const router = useRouter()

const {
  exportRecords,
  copyRecordContent,
} = useRecordStore()

const {
  sessionList,
  loadSessionRecords,
  deleteSession: deleteSessionFromCache,
  getSessionsByDevice,
  getSessionStats,
} = useRecordCache()

const sessionId = ref('')

const { bufferToDecFormat, bufferToHexFormat, bufferToString, stringToHtml } = useDataCode()

// 按设备分组的会话
const groupedSessions = computed(() => getSessionsByDevice())

// 会话统计信息
const stats = ref({ sessionCount: 0, totalRecords: 0 })

// 显示模式
const showFullDate = ref(false)

// 当前查看的会话信息
const selectedSession = computed(() => {
  if (!sessionId.value)
    return null
  return sessionList.value.find(session => session.id === sessionId.value)
})
const selectedSessionRecord = ref([])
watch(sessionId, (newId) => {
  if (newId) {
    selectedSessionRecord.value = loadSessionRecords(newId)
  }
}, { immediate: true })

// 加载统计信息
function loadStats() {
  try {
    const statsData = getSessionStats()
    stats.value = statsData
  }
  catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 格式化时间
function formatTime(timestamp) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化记录时间
function formatRecordTime(time) {
  return showFullDate.value
    ? dayjs(time).format('YYYY-MM-DD HH:mm:ss:SSS')
    : dayjs(time).format('HH:mm:ss:SSS')
}

// 切换时间格式
function toggleTimeFormat() {
  showFullDate.value = !showFullDate.value
}

// 切换记录显示格式
function toggleRecordDisplay(rIdx, record) {
  const recordTypes = ['hex', 'ascii', 'dec']
  const index = recordTypes.indexOf(record.display)
  record.display = recordTypes[(index + 1) % recordTypes.length]
  selectedSessionRecord.value[rIdx] = record
}

// 获取设备显示名称
function getDeviceDisplayName(session) {
  const deviceInfo = session.deviceInfo
  if (!deviceInfo || deviceInfo.type === 'unknown') {
    return '未知设备'
  }

  if (deviceInfo.type === 'serial') {
    return `${deviceInfo.name || '串口设备'} (${deviceInfo.port || '未知端口'})`
  }

  if (deviceInfo.type === 'bluetooth') {
    return `${deviceInfo.name || '蓝牙设备'} (${deviceInfo.port || '未知地址'})`
  }

  return deviceInfo.name || '未知设备'
}

// 加载会话（只读模式）
function loadSession(id) {
  try {
    sessionId.value = id
    loadSessionRecords(id)
    // 重新加载统计信息
    loadStats()
    // 切换到会话详情视图
  }
  catch (error) {
    console.error('加载会话失败:', error)
  }
}

// 关闭记录查看
function closeRecordView() {
  sessionId.value = ''
}

// 删除会话
function deleteSession(sessionId) {
  try {
    deleteSessionFromCache(sessionId)
    // 重新加载统计信息
    loadStats()
  }
  catch (error) {
    console.error('删除会话失败:', error)
  }
}

// 导出当前选中的会话记录
function exportCurrentSessionRecords() {
  exportRecords(selectedSessionRecord.value)
}

onMounted(() => {
  // 加载统计信息
  loadStats()
})
</script>

<template>
  <div class="container mx-auto p-6 max-w-8xl h-screen flex flex-col">
    <!-- 页面标题 -->
    <div class="mb-6">
      <Breadcrumb class="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/#/">
              首页
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink href="/#/record">
              会话历史
            </BreadcrumbLink>
          </BreadcrumbItem>

          <template v-if="selectedSession">
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{{ getDeviceDisplayName(selectedSession) }}</BreadcrumbPage>
            </BreadcrumbItem>
          </template>
        </BreadcrumbList>
      </Breadcrumb>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-2xl font-bold">
          会话历史记录
        </h1>
      </div>
      <p class="text-muted-foreground">
        查看所有设备的通讯会话记录
      </p>
    </div>

    <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
      <!-- 左侧：会话列表 -->
      <div class="flex-1 flex flex-col space-y-4 min-h-0">
        <div class="session-history space-y-4 flex-1 overflow-y-auto">
          <!-- 标题和统计 -->
          <div class="flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              {{ stats.sessionCount }} 个会话 · {{ stats.totalRecords }} 条记录
            </div>
          </div>

          <!-- 按设备分组的会话列表 -->
          <div class="space-y-4">
            <!-- 串口设备会话 -->
            <div v-if="groupedSessions.serial.length > 0" class="space-y-2">
              <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div class=" w-4 h-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Design Icons by Pictogrammers - https://github.com/Templarian/MaterialDesign/blob/master/LICENSE --><path fill="currentColor" d="M7 3h10v2h2v3h-3v6H8V8H5V5h2zm10 6h2v5h-2zm-6 6h2v7h-2zM5 9h2v5H5z" /></svg>
                </div>
                串口设备 ({{ groupedSessions.serial.length }})
              </div>
              <div class="space-y-1 ml-6">
                <div
                  v-for="session in groupedSessions.serial"
                  :key="session.id"
                  class="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  :class="{
                    'bg-primary/10 border border-primary/20': session.id === sessionId,
                  }"
                >
                  <div class="flex-1 min-w-0 space-y-3">
                    <div class="font-medium text-sm truncate">
                      {{ getDeviceDisplayName(session) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatTime(session.updatedAt) }} · {{ session.recordCount }} 条记录
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 cursor-pointer"
                      @click="loadSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" /></svg>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                      @click="deleteSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6" /></svg>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 蓝牙设备会话 -->
            <div v-if="groupedSessions.bluetooth.length > 0" class="space-y-2">
              <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div class=" w-4 h-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Design Icons by Pictogrammers - https://github.com/Templarian/MaterialDesign/blob/master/LICENSE --><path fill="currentColor" d="M14.88 16.29L13 18.17v-3.76m0-8.58l1.88 1.88L13 9.58m4.71-1.87L12 2h-1v7.58L6.41 5L5 6.41L10.59 12L5 17.58L6.41 19L11 14.41V22h1l5.71-5.71l-4.3-4.29z" /></svg>
                </div>
                蓝牙设备 ({{ groupedSessions.bluetooth.length }})
              </div>
              <div class="space-y-1 ml-6">
                <div
                  v-for="session in groupedSessions.bluetooth"
                  :key="session.id"
                  class="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  :class="{
                    'bg-primary/10 border border-primary/20': session.id === sessionId,
                  }"
                >
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">
                      {{ getDeviceDisplayName(session) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatTime(session.updatedAt) }} · {{ session.recordCount }} 条记录
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 cursor-pointer"
                      @click="loadSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" /></svg>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                      @click="deleteSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6" /></svg>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 未知设备会话 -->
            <div v-if="groupedSessions.unknown.length > 0" class="space-y-2">
              <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div class=" w-4 h-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" /><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M10.125 8.875a1.875 1.875 0 1 1 2.828 1.615c-.475.281-.953.708-.953 1.26V13" /><circle cx="12" cy="16" r="1" fill="currentColor" /></g></svg>
                </div>
                其他设备 ({{ groupedSessions.unknown.length }})
              </div>
              <div class="space-y-1 ml-6">
                <div
                  v-for="session in groupedSessions.unknown"
                  :key="session.id"
                  class="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  :class="{
                    'bg-primary/10 border border-primary/20': session.id === sessionId,
                  }"
                >
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">
                      {{ getDeviceDisplayName(session) }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatTime(session.updatedAt) }} · {{ session.recordCount }} 条记录
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 cursor-pointer"
                      @click="loadSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" /></svg>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                      @click="deleteSession(session.id)"
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6" /></svg>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="sessionList.length === 0" class="text-center py-8 text-muted-foreground">
              <div class=" w-12 h-12 mx-auto mb-4 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5m4-1v5l4 2" /></g></svg>
              </div>
              <p class="text-sm">
                暂无会话历史
              </p>
              <p class="text-xs mt-1">
                连接设备后创建新会话开始记录
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：记录查看区域 -->
      <div v-if="sessionList.length > 0" class="flex-1 flex flex-col space-y-4 min-h-0">
        <div v-if="selectedSession" class="border rounded-lg flex-1 flex flex-col min-h-0">
          <!-- 记录查看头部 -->
          <div class="border-b p-4 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <h3 class="font-medium">
                  {{ getDeviceDisplayName(selectedSession) }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  更新于 {{ formatTime(selectedSession.updatedAt) }} · {{ selectedSessionRecord.length }} 条记录
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" class="cursor-pointer" @click="exportCurrentSessionRecords">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 12a8 8 0 1 0 16 0" />
                    <path stroke-linejoin="round" d="m12 2l3 3m-3-3l-3 3m3-3v10" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" class="cursor-pointer" @click="closeRecordView">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          <!-- 记录内容区域 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            <template v-for="(record, rIdx) in selectedSessionRecord" :key="record.time">
              <div v-if="record.type == 'read'" class="chat chat-start group">
                <div class="chat-header mx-2 flex">
                  <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
                    {{ formatRecordTime(record.time) }}
                  </div>
                  <div class="w-4" />
                  <div class="cursor-pointer" @click="() => toggleRecordDisplay(rIdx, record)">
                    {{ record.display }}
                  </div>
                </div>
                <div class="chat-bubble break-words text-sm">
                  <div v-if="record.display == 'hex'">
                    {{ bufferToHexFormat(record.data) }}
                  </div>
                  <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))" />
                  <div v-else>
                    {{ bufferToDecFormat(record.data) }}
                  </div>
                </div>
                <div class="chat-footer mt-1">
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button variant="ghost" size="icon" class="w-6 h-6 p-0.75 cursor-pointer" @click="() => copyRecordContent(record)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              <div v-if="record.type == 'write'" class="chat chat-end group">
                <div class="chat-header mx-2 flex">
                  <div class="text-sm opacity-70 cursor-pointer hover:opacity-100 transition-opacity" @click="toggleTimeFormat">
                    {{ formatRecordTime(record.time) }}
                  </div>
                  <div class="w-4" />
                  <div class="cursor-pointer" @click="() => toggleRecordDisplay(rIdx, record)">
                    {{ record.display }}
                  </div>
                </div>
                <div class="chat-bubble break-words text-sm">
                  <div v-if="record.display == 'hex'">
                    {{ bufferToHexFormat(record.data) }}
                  </div>
                  <div v-else-if="record.display == 'ascii'" v-html="stringToHtml(bufferToString(record.data))" />
                  <div v-else>
                    {{ bufferToDecFormat(record.data) }}
                  </div>
                </div>
                <div class="chat-footer mt-1">
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button variant="ghost" size="icon" class="w-6 h-6 p-0.75 cursor-pointer" @click="() => copyRecordContent(record)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </template>

            <!-- 空记录状态 -->
            <div v-if="selectedSessionRecord.length === 0" class="text-center py-8 text-muted-foreground">
              <div class="w-12 h-12 mx-auto mb-4 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <p class="text-sm">
                该会话暂无记录
              </p>
            </div>
          </div>
        </div>

        <!-- 未选择会话状态 -->
        <div v-else class="border rounded-lg flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div>
            <div class="w-16 h-16 mx-auto mb-4 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            </div>
            <p class="text-lg font-medium mb-2">
              选择会话查看记录
            </p>
            <p class="text-sm">
              点击左侧会话列表中的查看按钮来查看会话记录
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移除固定高度限制，让容器自适应 */

/* 记录面板样式，与RecordPanel保持一致 */
::-webkit-scrollbar {
  width: 4px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  border-radius: 4px;
  margin: 15px;
}

::-webkit-scrollbar-button {
  width: 0;
  height: 0;
}
</style>
