<script setup>
import { useMagicKeys } from '@vueuse/core'
import { Search } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useRecordStore } from '@/store/useRecordStore'
import { getOS } from '@/utils/os'

const open = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchTotal = ref(0)
let searchToken = 0

const { searchRecords, scrollToRecord } = useRecordStore()

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'f' && e.type === 'keydown')
      e.preventDefault()
    if (e.metaKey && e.key === 'f' && e.type === 'keydown')
      e.preventDefault()
  },
})

const isMac = (getOS() === 'MacOS' || getOS() === 'iOS')
const searchKey = isMac ? keys['cmd+f'] : keys['ctrl+f']
const escape = keys.escape

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function performSearch() {
  const token = ++searchToken
  const { results, total } = await searchRecords(searchQuery.value, undefined, 50)
  if (token !== searchToken)
    return
  searchResults.value = results || []
  searchTotal.value = total || 0
}

watch(searchQuery, () => {
  performSearch()
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    performSearch()
    nextTick(() => {
      const input = document.querySelector('[data-search-input]')
      if (input)
        input.focus()
    })
  }
  else {
    searchQuery.value = ''
    searchResults.value = []
    searchTotal.value = 0
  }
}

watch(searchKey, (searchKeyPressed) => {
  if (searchKeyPressed)
    toggle()
})

watch(escape, (escapePressed) => {
  if (escapePressed && open.value)
    open.value = false
})

function getRecordTypeText(type) {
  switch (type) {
    case 'read': return '接收'
    case 'write': return '发送'
    case 'system': return '系统'
    default: return type
  }
}

function highlightMatch(text, query) {
  const safeText = escapeHtml(text || '')
  if (!query)
    return safeText
  const safeQuery = escapeHtml(query)
  const regex = new RegExp(`(${escapeRegExp(safeQuery)})`, 'gi')
  return safeText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

function selectResult(record) {
  scrollToRecord(record.index)
  open.value = false
  searchQuery.value = ''
}

onMounted(() => {
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

      <CommandGroup v-if="searchResults.length > 0" :heading="searchQuery.trim() ? '搜索结果' : '最近记录'">
        <CommandItem
          v-for="record in searchResults"
          :key="record.id"
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
              <span v-html="highlightMatch(record.dataText || record.text, searchQuery)" />
            </div>
          </div>

          <div class="text-xs text-muted-foreground">
            记录 #{{ record.index + 1 }} · {{ record.byteLength }} 字节
          </div>
        </CommandItem>
      </CommandGroup>

      <div v-if="searchTotal > searchResults.length" class="p-2 text-xs text-muted-foreground text-center">
        显示前 {{ searchResults.length }} 条结果，共找到 {{ searchTotal }} 条记录
      </div>
    </CommandList>
  </CommandDialog>
</template>
