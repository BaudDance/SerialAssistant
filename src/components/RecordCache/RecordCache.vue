<script setup>
import { toast } from 'vue-sonner'
import { useRecordStore } from '@/store/useRecordStore'
import { useSettingStore } from '@/store/useSettingStore'

const { recordCacheEnabled } = useSettingStore()
const {
  getCacheStats,
  isCacheLoading,
  cacheSize,
  loadRecordsFromCacheStore,
  clearRecords,
} = useRecordStore()

const cacheStats = ref({
  recordCount: 0,
  totalKeys: 0,
  estimatedSize: 0,
  formattedSize: '0 B',
})

const isLoadingStats = ref(false)
// 加载缓存统计信息
async function loadCacheStats() {
  try {
    isLoadingStats.value = true
    cacheStats.value = await getCacheStats()
  }
  catch (error) {
    console.error('加载缓存统计失败:', error)
    toast.error('加载缓存统计失败')
  }
  finally {
    isLoadingStats.value = false
  }
}

// 清除所有缓存
async function clearAllCache() {
  try {
    await clearRecords()
    await loadCacheStats()
    toast.success('缓存已清除')
  }
  catch (error) {
    console.error('清除缓存失败:', error)
    toast.error('清除缓存失败')
  }
}

// 手动加载缓存
async function manualLoadCache() {
  try {
    await loadRecordsFromCacheStore()
    await loadCacheStats()
  }
  catch (error) {
    console.error('加载缓存失败:', error)
    toast.error('加载缓存失败')
  }
}

// 缓存状态文本
const cacheStatusText = computed(() => {
  if (!recordCacheEnabled.value)
    return '已禁用'
  if (isCacheLoading.value)
    return '处理中...'
  if (cacheSize.value > 0)
    return `已缓存 ${cacheSize.value} 条记录`
  return '无缓存数据'
})

onMounted(() => {
  loadCacheStats()
})
</script>

<template>
  <!-- 缓存开关 -->
  <div class="flex items-center justify-between">
    <div class="space-y-0.5">
      <Label class="text-base">启用记录缓存</Label>
      <div class="text-sm text-muted-foreground">
        开启后，接收的记录将自动保存到本地缓存，刷新页面或重新打开浏览器时数据不会丢失
      </div>
    </div>
    <Switch
      v-model="recordCacheEnabled"
      :disabled="isCacheLoading"
    />
  </div>

  <!-- 缓存状态 -->
  <div class="space-y-2">
    <Label class="text-base">缓存状态</Label>
    <div class="flex items-center gap-2">
      <div
        class="w-2 h-2 rounded-full"
        :class="{
          'bg-green-500': recordCacheEnabled && cacheSize > 0,
          'bg-yellow-500': recordCacheEnabled && cacheSize === 0,
          'bg-gray-400': !recordCacheEnabled,
        }"
      />
      <span class="text-sm text-muted-foreground">{{ cacheStatusText }}</span>
    </div>
  </div>

  <!-- 缓存统计 -->
  <div v-if="recordCacheEnabled" class="space-y-3">
    <Label class="text-base">缓存统计</Label>
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="space-y-1">
        <div class="text-muted-foreground">
          记录数量
        </div>
        <div class="font-mono">
          {{ isLoadingStats ? '...' : cacheStats.recordCount }}
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-muted-foreground">
          缓存大小
        </div>
        <div class="font-mono">
          {{ isLoadingStats ? '...' : cacheStats.formattedSize }}
        </div>
      </div>
    </div>
  </div>

  <!-- 操作按钮 -->
  <div v-if="recordCacheEnabled" class="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      :disabled="isLoadingStats"
      @click="loadCacheStats"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
      刷新统计
    </Button>

    <Button
      variant="outline"
      size="sm"
      :disabled="isCacheLoading"
      @click="manualLoadCache"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      加载缓存
    </Button>

    <Button
      variant="destructive"
      size="sm"
      :disabled="isCacheLoading || cacheSize === 0"
      @click="clearAllCache"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
      清除缓存
    </Button>
  </div>

  <!-- 缓存说明 -->
  <div class="text-xs text-muted-foreground space-y-1">
    <div>• 缓存数据存储在浏览器的 IndexedDB 中，仅在当前域名下可访问</div>
    <div>• 大量数据时会自动进行性能优化，采用防抖和批量处理</div>
    <div>• 清除接收记录时会同时清除对应的缓存数据</div>
  </div>
</template>
