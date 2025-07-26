import dayjs from 'dayjs'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useRecordCache } from '@/composables/useRecordCache/useRecordCache'
import { useSettingStore } from '@/store/useSettingStore'
/**
 *
 * record definition:
 * {
 *  type: "read" | "write" |"system"",
 *  data: Uint8Array,
 *  timestamp: Date,
 *  display: "hex" | "ascii",
 * }
 */
const records = ref([])
const readingRecord = ref(undefined)
const pinBottom = ref(true)
const scrollToRecordIndex = ref(-1) // 用于触发滚动到指定记录

const rxCount = ref(0)
const txCount = ref(0)

const { recordCacheEnabled } = useSettingStore()

// 初始化缓存
const {
  debouncedSaveRecords,
  loadRecordsFromCache,
  clearRecordsCache,
  isLoading: isCacheLoading,
  cacheSize,
  getCacheStats,
} = useRecordCache()

// 是否已从缓存加载
const isLoadedFromCache = ref(false)

function addRecord(record) {
  records.value.push(record)
  rxCount.value += record.type === 'read' ? record.data.length : 0
  txCount.value += record.type === 'write' ? record.data.length : 0

  // 防抖保存到缓存
  if (recordCacheEnabled.value) {
    debouncedSaveRecords(records.value)
  }
}

function clearRecords() {
  records.value = []
  rxCount.value = 0
  txCount.value = 0

  // 清除缓存
  if (recordCacheEnabled.value) {
    clearRecordsCache()
  }
}

// 从缓存加载记录
async function loadRecordsFromCacheStore() {
  if (isLoadedFromCache.value || !recordCacheEnabled.value)
    return

  try {
    const cachedRecords = await loadRecordsFromCache()
    if (cachedRecords.length > 0) {
      records.value = cachedRecords

      // 重新计算统计数据
      rxCount.value = 0
      txCount.value = 0
      cachedRecords.forEach((record) => {
        rxCount.value += record.type === 'read' ? record.data.length : 0
        txCount.value += record.type === 'write' ? record.data.length : 0
      })

      toast.success(`已从缓存加载 ${cachedRecords.length} 条记录`)
    }
    isLoadedFromCache.value = true
  }
  catch (error) {
    console.error('从缓存加载记录失败:', error)
    toast.error('从缓存加载记录失败')
  }
}

export function useRecordStore() {
  const { bufferToDecFormat, bufferToHexFormat, bufferToString, stringToHtml } = useDataCode()

  // 监听缓存启用状态变化，在启用时自动加载缓存
  watch(() => recordCacheEnabled.value, (enabled) => {
    if (enabled && !isLoadedFromCache.value && typeof window !== 'undefined') {
      loadRecordsFromCacheStore()
    }
    else if (!enabled) {
      // 缓存禁用时重置加载状态，以便重新启用时可以加载
      isLoadedFromCache.value = false
    }
  }, { immediate: true })

  function exportRecords() {
    if (!records.value.length) {
      toast.error('记录为空，导出失败')
      return
    }

    const exportData = records.value.map((record) => {
      const type = record.type
      const timestamp = record.timestamp || new Date(record.time).getTime() || null
      const time = timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS') : null
      const display = record.display
      const data = record.display === 'hex' ? bufferToHexFormat(record.data) : bufferToString(record.data)

      return {
        type,
        data,
        timestamp,
        time,
        display,
      }
    })

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const fileName = `records-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  async function copyRecordContent(record) {
    let content = ''
    if (record.display === 'hex') {
      content = bufferToHexFormat(record.data)
    }
    else if (record.display === 'ascii') {
      content = bufferToString(record.data)
    }
    else {
      content = bufferToDecFormat(record.data)
    }

    try {
      await navigator.clipboard.writeText(content)
      toast.success('复制消息内容成功')
    }
    catch (err) {
      console.error('复制失败:', err)
      toast.error('复制消息内容失败')
    }
  }

  function scrollToRecord(index) {
    scrollToRecordIndex.value = index
    // 重置滚动索引，避免重复触发
    setTimeout(() => {
      scrollToRecordIndex.value = -1
    }, 100)
  }

  return {
    records,
    readingRecord,
    pinBottom,
    scrollToRecordIndex,
    rxCount,
    txCount,
    addRecord,
    clearRecords,
    exportRecords,
    copyRecordContent,
    scrollToRecord,

    // 缓存相关
    loadRecordsFromCacheStore,
    recordCacheEnabled,
    isCacheLoading,
    cacheSize,
    getCacheStats,
    isLoadedFromCache,
  }
}
