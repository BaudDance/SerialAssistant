<script setup>
import { useMagicKeys } from '@vueuse/core'
import dayjs from 'dayjs'
import Fuse from 'fuse.js'
import { Search } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useRecordStore } from '@/store/useRecordStore'
import { getOS } from '@/utils/os'

const open = ref(false)
const searchQuery = ref('')
const searchResults = ref([])

const { records, scrollToRecord } = useRecordStore()
const { bufferToHexFormat, bufferToString } = useDataCode()

// 使用 useMagicKeys 处理快捷键
const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'f' && e.type === 'keydown')
      e.preventDefault()
    if (e.metaKey && e.key === 'f' && e.type === 'keydown')
      e.preventDefault()
  },
})
// 根据操作系统选择合适的快捷键
const isMac = (getOS() === 'MacOS' || getOS() === 'iOS')
const searchKey = isMac ? keys['cmd+f'] : keys['ctrl+f']
const escape = keys.escape

// Fuse.js 配置
const fuseOptions = {
  keys: [
    'type',
    'dataText',
    'timeFormatted',
  ],
  threshold: 0.6, // 提高阈值，使搜索更宽松
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true, // 忽略位置，允许在任何位置匹配
  findAllMatches: true, // 查找所有匹配项
}

// 创建搜索数据
const searchableRecords = computed(() => {
  return records.value.map((record, index) => {
    let dataText = ''

    // 处理不同类型的data字段
    if (typeof record.data === 'string') {
      // 如果data是字符串格式（如导入的数据），直接使用
      dataText = record.data
    }
    else if (record.data instanceof Uint8Array) {
      // 如果data是Uint8Array格式（正常运行时的数据），进行格式化
      dataText = record.display === 'hex'
        ? bufferToHexFormat(record.data)
        : bufferToString(record.data)
    }
    else {
      // 其他情况，尝试转换为字符串
      dataText = String(record.data)
    }

    const timeFormatted = record.timestamp
      ? dayjs(record.timestamp).format('YYYY-MM-DD HH:mm:ss:SSS')
      : ''

    return {
      ...record,
      index,
      dataText,
      timeFormatted,
    }
  })
})

// 创建 Fuse 实例
const fuse = computed(() => new Fuse(searchableRecords.value, fuseOptions))

// 搜索功能
function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = searchableRecords.value
    return
  }

  const results = fuse.value.search(searchQuery.value)
  searchResults.value = results.map(result => result.item)
}

// 监听搜索查询变化
watch(searchQuery, performSearch)

// 切换搜索面板
function toggle() {
  open.value = !open.value
  if (open.value) {
    // 打开时执行搜索以显示全部记录
    performSearch()
    nextTick(() => {
      // 聚焦搜索输入框
      const input = document.querySelector('[data-search-input]')
      if (input)
        input.focus()
    })
  }
  else {
    searchQuery.value = ''
    searchResults.value = []
  }
}

// 使用 useMagicKeys 监听快捷键
watch(searchKey, (searchKeyPressed) => {
  if (searchKeyPressed) {
    toggle()
  }
})
// 监听 Esc 键 关闭搜索面板
watch(escape, (escapePressed) => {
  if (escapePressed && open.value) {
    open.value = false
  }
})

// 格式化记录类型显示
function getRecordTypeText(type) {
  switch (type) {
    case 'read': return '接收'
    case 'write': return '发送'
    case 'system': return '系统'
    default: return type
  }
}

// 高亮匹配文本
function highlightMatch(text, query) {
  if (!query)
    return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

// 选择搜索结果
function selectResult(record) {
  // 滚动到对应的记录
  scrollToRecord(record.index)
  // 关闭搜索面板
  open.value = false
  // 清空搜索
  searchQuery.value = ''
}

// 生命周期
onMounted(() => {
  // 初始化显示全部记录
  performSearch()
})
</script>

<template>
  <Button variant="secondary" class="w-48 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 cursor-pointer" @click.stop="toggle">
    <Search />
    <span>搜索记录</span>
  </Button>

  <CommandDialog v-model:open="open">
    <CommandInput
      v-model="searchQuery"
      data-search-input
      placeholder="搜索记录"
    />
    <CommandList>
      <CommandEmpty v-if="searchQuery.trim() && searchResults.length === 0">
        未找到匹配的记录
      </CommandEmpty>

      <CommandGroup v-if="searchResults.length > 0" :heading="searchQuery.trim() ? '搜索结果' : '全部记录'">
        <CommandItem
          v-for="record in searchResults.slice(0, 50)"
          :key="record.index"
          :value="`record-${record.index}`"
          class="flex flex-col items-start gap-1 p-3 cursor-pointer"
          @click="selectResult(record)"
        >
          <div class="flex items-center gap-2 w-full">
            <span
              class="px-2 py-1 text-xs rounded font-medium"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': record.type === 'read',
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': record.type === 'write',
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': record.type === 'system',
              }"
            >
              {{ getRecordTypeText(record.type) }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ record.timeFormatted }}
            </span>
          </div>

          <div class="text-sm w-full">
            <div class="font-mono text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto break-all">
              <span v-html="highlightMatch(record.dataText, searchQuery)" />
            </div>
          </div>

          <div class="text-xs text-muted-foreground">
            记录 #{{ record.index + 1 }} • {{ record.data.length }} 字节
          </div>
        </CommandItem>
      </CommandGroup>

      <div v-if="searchResults.length > 50" class="p-2 text-xs text-muted-foreground text-center">
        显示前 50 条结果，共找到 {{ searchResults.length }} 条记录
      </div>
    </CommandList>
  </CommandDialog>
</template>
