import { createGlobalState } from '@vueuse/core'
import localforage from 'localforage'
import { ref } from 'vue'
import { useLayout } from '@/composables/useLayout'
import { useSettingStore } from '@/store/useSettingStore'

// 配置 store 使用 IndexedDB
const store = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  name: 'SerialAssistant',
  version: 1.0,
  storeName: 'records',
  description: 'Serial Assistant Records Cache',
})

export const useRecordCache = createGlobalState(() => {
  const { recordCacheEnabled } = useSettingStore()
  const { showTerminalMode } = useLayout()

  const CACHE_KEY = 'serial_records'
  const BATCH_SIZE = 100 // 批量处理大小
  const DEBOUNCE_DELAY = 500 // 防抖延迟

  // 缓存状态
  const isLoading = ref(false)
  const cacheSize = ref(0)

  // 防抖定时器
  let debounceTimer = null

  /**
   * 序列化记录数据
   * @param {Array} records - 记录数组
   * @returns {Array} 序列化后的记录数组
   */
  function serializeRecords(records) {
    return records.map(record => ({
      type: record.type,
      data: Array.from(record.data), // 将 Uint8Array 转换为普通数组
      time: record.time,
      timestamp: record.timestamp,
      display: record.display,
    }))
  }

  /**
   * 反序列化记录数据
   * @param {Array} serializedRecords - 序列化的记录数组
   * @returns {Array} 反序列化后的记录数组
   */
  function deserializeRecords(serializedRecords) {
    if (!Array.isArray(serializedRecords))
      return []

    return serializedRecords.map(record => ({
      ...record,
      data: new Uint8Array(record.data), // 将普通数组转换回 Uint8Array
    }))
  }

  /**
   * 批量保存记录到缓存
   * @param {Array} records - 要保存的记录数组
   */
  async function saveRecordsToCache(records) {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || !records.length || showTerminalMode.value)
      return

    try {
      isLoading.value = true
      const serializedRecords = serializeRecords(records)
      await store.setItem(CACHE_KEY, serializedRecords)
      cacheSize.value = serializedRecords.length
    }
    catch (error) {
      console.error('保存记录到缓存失败:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * 防抖保存记录
   * @param {Array} records - 要保存的记录数组
   */
  function debouncedSaveRecords(records) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      saveRecordsToCache(records)
    }, DEBOUNCE_DELAY)
  }

  /**
   * 从缓存加载记录
   * @returns {Promise<Array>} 加载的记录数组
   */
  async function loadRecordsFromCache() {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || showTerminalMode.value)
      return []

    try {
      isLoading.value = true
      const serializedRecords = await store.getItem(CACHE_KEY)
      if (!serializedRecords)
        return []

      const records = deserializeRecords(serializedRecords)
      cacheSize.value = records.length
      return records
    }
    catch (error) {
      console.error('从缓存加载记录失败:', error)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * 清除缓存中的记录
   */
  async function clearRecordsCache() {
    try {
      await store.removeItem(CACHE_KEY)
      cacheSize.value = 0
    }
    catch (error) {
      console.error('清除记录缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<object>} 缓存统计信息
   */
  async function getCacheStats() {
    try {
      const keys = await store.keys()
      const length = await store.length()

      // 估算缓存大小（字节）
      let estimatedSize = 0
      if (keys.includes(CACHE_KEY)) {
        const records = await store.getItem(CACHE_KEY)
        if (records) {
          estimatedSize = JSON.stringify(records).length
        }
      }

      return {
        recordCount: cacheSize.value,
        totalKeys: length,
        estimatedSize,
        formattedSize: formatBytes(estimatedSize),
      }
    }
    catch (error) {
      console.error('获取缓存统计信息失败:', error)
      return {
        recordCount: 0,
        totalKeys: 0,
        estimatedSize: 0,
        formattedSize: '0 B',
      }
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小字符串
   */
  function formatBytes(bytes) {
    if (bytes === 0)
      return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * 优化大量数据的缓存性能
   * @param {Array} records - 记录数组
   * @param {Function} onProgress - 进度回调函数
   */
  async function optimizedSaveRecords(records, onProgress) {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || !records.length || showTerminalMode.value)
      return

    try {
      isLoading.value = true

      // 分批处理大量数据
      const batches = []
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        batches.push(records.slice(i, i + BATCH_SIZE))
      }

      const serializedRecords = []

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const serializedBatch = serializeRecords(batch)
        serializedRecords.push(...serializedBatch)

        // 报告进度
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: batches.length,
            percentage: Math.round(((i + 1) / batches.length) * 100),
          })
        }

        // 让出控制权，避免阻塞UI
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      await store.setItem(CACHE_KEY, serializedRecords)
      cacheSize.value = serializedRecords.length
    }
    catch (error) {
      console.error('优化保存记录到缓存失败:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    isLoading,
    cacheSize,

    // 方法
    saveRecordsToCache,
    debouncedSaveRecords,
    loadRecordsFromCache,
    clearRecordsCache,
    getCacheStats,
    optimizedSaveRecords,

    // 工具方法
    serializeRecords,
    deserializeRecords,
    formatBytes,
  }
})
