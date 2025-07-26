import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRecordCache } from '@/composables/useRecordCache/useRecordCache'

// Mock localforage
const mockInstance = vi.hoisted(() => ({
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  keys: vi.fn(),
  length: vi.fn(),
}))

vi.mock('localforage', () => ({
  default: {
    createInstance: vi.fn(() => mockInstance),
    INDEXEDDB: 'indexeddb',
  },
}))

// Mock useSettingStore
vi.mock('@/store/useSettingStore', () => ({
  useSettingStore: () => ({
    recordCacheEnabled: ref(true),
  }),
}))

describe('useRecordCache', () => {
  let cache

  beforeEach(() => {
    vi.clearAllMocks()
    cache = useRecordCache()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('序列化和反序列化', () => {
    it('应该正确序列化记录数据', () => {
      const records = [
        {
          type: 'read',
          data: new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
          time: Date.now(),
          timestamp: Date.now(),
          display: 'ascii',
        },
        {
          type: 'write',
          data: new Uint8Array([87, 111, 114, 108, 100]), // "World"
          time: Date.now(),
          timestamp: Date.now(),
          display: 'hex',
        },
      ]

      const serialized = cache.serializeRecords(records)

      expect(serialized).toHaveLength(2)
      expect(serialized[0].data).toEqual([72, 101, 108, 108, 111])
      expect(serialized[1].data).toEqual([87, 111, 114, 108, 100])
      expect(serialized[0].type).toBe('read')
      expect(serialized[1].type).toBe('write')
    })

    it('应该正确反序列化记录数据', () => {
      const serializedRecords = [
        {
          type: 'read',
          data: [72, 101, 108, 108, 111],
          time: Date.now(),
          timestamp: Date.now(),
          display: 'ascii',
        },
      ]

      const deserialized = cache.deserializeRecords(serializedRecords)

      expect(deserialized).toHaveLength(1)
      expect(deserialized[0].data).toBeInstanceOf(Uint8Array)
      expect(Array.from(deserialized[0].data)).toEqual([72, 101, 108, 108, 111])
      expect(deserialized[0].type).toBe('read')
    })

    it('应该处理空数组和无效数据', () => {
      expect(cache.serializeRecords([])).toEqual([])
      expect(cache.deserializeRecords([])).toEqual([])
      expect(cache.deserializeRecords(null)).toEqual([])
      expect(cache.deserializeRecords(undefined)).toEqual([])
      expect(cache.deserializeRecords('invalid')).toEqual([])
    })
  })

  describe('缓存操作', () => {
    it('应该保存记录到缓存', async () => {
      const records = [
        {
          type: 'read',
          data: new Uint8Array([1, 2, 3]),
          time: Date.now(),
          display: 'hex',
        },
      ]

      mockInstance.setItem.mockResolvedValue()

      await cache.saveRecordsToCache(records)

      expect(mockInstance.setItem).toHaveBeenCalledWith(
        'serial_records',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'read',
            data: [1, 2, 3],
            display: 'hex',
          }),
        ]),
      )
    })

    it('应该从缓存加载记录', async () => {
      const cachedData = [
        {
          type: 'write',
          data: [4, 5, 6],
          time: Date.now(),
          display: 'ascii',
        },
      ]

      mockInstance.getItem.mockResolvedValue(cachedData)

      const result = await cache.loadRecordsFromCache()

      expect(mockInstance.getItem).toHaveBeenCalledWith('serial_records')
      expect(result).toHaveLength(1)
      expect(result[0].data).toBeInstanceOf(Uint8Array)
      expect(Array.from(result[0].data)).toEqual([4, 5, 6])
    })

    it('应该清除缓存', async () => {
      mockInstance.removeItem.mockResolvedValue()

      await cache.clearRecordsCache()

      expect(mockInstance.removeItem).toHaveBeenCalledWith('serial_records')
    })

    it('应该处理缓存操作错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockInstance.setItem.mockRejectedValue(new Error('Storage error'))

      await cache.saveRecordsToCache([{ type: 'read', data: new Uint8Array([1]) }])

      expect(consoleSpy).toHaveBeenCalledWith('保存记录到缓存失败:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('防抖功能', () => {
    it('应该防抖保存记录', async () => {
      vi.useFakeTimers()

      const records = [{ type: 'read', data: new Uint8Array([1]) }]
      mockInstance.setItem.mockResolvedValue()

      // 快速调用多次
      cache.debouncedSaveRecords(records)
      cache.debouncedSaveRecords(records)
      cache.debouncedSaveRecords(records)

      // 在防抖时间内，不应该调用 setItem
      expect(mockInstance.setItem).not.toHaveBeenCalled()

      // 等待防抖时间
      vi.advanceTimersByTime(500)

      // 现在应该只调用一次
      await vi.runAllTimersAsync()
      expect(mockInstance.setItem).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('性能优化', () => {
    it('应该批量处理大量数据', async () => {
      const largeRecords = Array.from({ length: 250 }, (_, i) => ({
        type: 'read',
        data: new Uint8Array([i % 256]),
        time: Date.now() + i,
        display: 'hex',
      }))

      mockInstance.setItem.mockResolvedValue()

      const progressCallback = vi.fn()

      await cache.optimizedSaveRecords(largeRecords, progressCallback)

      expect(mockInstance.setItem).toHaveBeenCalledTimes(1)
      expect(progressCallback).toHaveBeenCalled()

      // 检查进度回调的参数
      const progressCalls = progressCallback.mock.calls
      expect(progressCalls.length).toBeGreaterThan(0)
      expect(progressCalls[progressCalls.length - 1][0]).toMatchObject({
        current: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      })
    })
  })

  describe('缓存统计', () => {
    it('应该获取缓存统计信息', async () => {
      const mockKeys = ['serial_records', 'other_key']
      const mockRecords = [
        { type: 'read', data: [1, 2, 3], time: Date.now() },
      ]

      mockInstance.keys.mockResolvedValue(mockKeys)
      mockInstance.length.mockResolvedValue(2)
      mockInstance.getItem.mockResolvedValue(mockRecords)

      const stats = await cache.getCacheStats()

      expect(stats).toMatchObject({
        recordCount: expect.any(Number),
        totalKeys: 2,
        estimatedSize: expect.any(Number),
        formattedSize: expect.any(String),
      })
    })
  })

  describe('字节格式化', () => {
    it('应该正确格式化字节大小', () => {
      expect(cache.formatBytes(0)).toBe('0 B')
      expect(cache.formatBytes(1024)).toBe('1 KB')
      expect(cache.formatBytes(1048576)).toBe('1 MB')
      expect(cache.formatBytes(1073741824)).toBe('1 GB')
      expect(cache.formatBytes(1536)).toBe('1.5 KB')
    })
  })

  describe('缓存启用状态', () => {
    it('应该在缓存禁用时跳过操作', async () => {
      cache.isCacheEnabled.value = false

      const records = [{ type: 'read', data: new Uint8Array([1]) }]

      await cache.saveRecordsToCache(records)
      const result = await cache.loadRecordsFromCache()

      expect(mockInstance.setItem).not.toHaveBeenCalled()
      expect(mockInstance.getItem).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
})
