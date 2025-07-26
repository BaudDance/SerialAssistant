import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRecordStore } from '@/store/useRecordStore'

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

// Mock toast
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useDataCode
vi.mock('@/composables/useDataCode/useDataCode', () => ({
  useDataCode: () => ({
    bufferToDecFormat: vi.fn(data => Array.from(data).join(' ')),
    bufferToHexFormat: vi.fn(data => Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')),
    bufferToString: vi.fn(data => new TextDecoder().decode(data)),
    stringToHtml: vi.fn(str => str),
  }),
}))

describe('useRecordStore 缓存集成测试', () => {
  let recordStore

  beforeEach(() => {
    vi.clearAllMocks()
    mockInstance.setItem.mockResolvedValue()
    mockInstance.getItem.mockResolvedValue(null)
    mockInstance.removeItem.mockResolvedValue()
    mockInstance.keys.mockResolvedValue([])
    mockInstance.length.mockResolvedValue(0)

    recordStore = useRecordStore()

    // 清理状态
    recordStore.records.value = []
    recordStore.rxCount.value = 0
    recordStore.txCount.value = 0
    recordStore.isLoadedFromCache.value = false
  })

  describe('记录添加和缓存', () => {
    it('应该在添加记录时自动保存到缓存', async () => {
      vi.useFakeTimers()

      const record = {
        type: 'read',
        data: new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
        time: Date.now(),
        display: 'ascii',
      }

      recordStore.addRecord(record)

      // 等待防抖时间
      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()

      expect(mockInstance.setItem).toHaveBeenCalledWith(
        'serial_records',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'read',
            data: [72, 101, 108, 108, 111],
            display: 'ascii',
          }),
        ]),
      )

      vi.useRealTimers()
    })

    it('应该正确统计接收和发送字节数', () => {
      const readRecord = {
        type: 'read',
        data: new Uint8Array([1, 2, 3]),
        time: Date.now(),
        display: 'hex',
      }

      const writeRecord = {
        type: 'write',
        data: new Uint8Array([4, 5]),
        time: Date.now(),
        display: 'hex',
      }

      recordStore.addRecord(readRecord)
      recordStore.addRecord(writeRecord)

      expect(recordStore.rxCount.value).toBe(3)
      expect(recordStore.txCount.value).toBe(2)
    })
  })

  describe('缓存加载', () => {
    it('应该从缓存加载记录并恢复统计数据', async () => {
      const cachedRecords = [
        {
          type: 'read',
          data: [1, 2, 3, 4],
          time: Date.now(),
          display: 'hex',
        },
        {
          type: 'write',
          data: [5, 6],
          time: Date.now(),
          display: 'ascii',
        },
      ]

      // 重新创建store实例以避免自动加载的影响
      const freshRecordStore = useRecordStore()
      freshRecordStore.records.value = []
      freshRecordStore.rxCount.value = 0
      freshRecordStore.txCount.value = 0
      freshRecordStore.isLoadedFromCache.value = false

      mockInstance.getItem.mockResolvedValue(cachedRecords)

      await freshRecordStore.loadRecordsFromCacheStore()

      expect(freshRecordStore.records.value).toHaveLength(2)
      expect(freshRecordStore.records.value[0].data).toBeInstanceOf(Uint8Array)
      expect(Array.from(freshRecordStore.records.value[0].data)).toEqual([1, 2, 3, 4])
      expect(freshRecordStore.rxCount.value).toBe(4)
      expect(freshRecordStore.txCount.value).toBe(2)
      expect(freshRecordStore.isLoadedFromCache.value).toBe(true)
    })

    it('应该防止重复加载缓存', async () => {
      // 重新创建store实例以避免自动加载的影响
      const freshRecordStore = useRecordStore()
      freshRecordStore.records.value = []
      freshRecordStore.rxCount.value = 0
      freshRecordStore.txCount.value = 0
      freshRecordStore.isLoadedFromCache.value = false

      // 清除之前的mock调用记录
      vi.clearAllMocks()
      mockInstance.getItem.mockResolvedValue('[]')

      await freshRecordStore.loadRecordsFromCacheStore()
      await freshRecordStore.loadRecordsFromCacheStore()

      expect(mockInstance.getItem).toHaveBeenCalledTimes(1)
    })
  })

  describe('记录清除', () => {
    it('应该清除记录和缓存', async () => {
      // 先添加一些记录
      recordStore.addRecord({
        type: 'read',
        data: new Uint8Array([1, 2, 3]),
        time: Date.now(),
        display: 'hex',
      })

      expect(recordStore.records.value).toHaveLength(1)
      expect(recordStore.rxCount.value).toBe(3)

      recordStore.clearRecords()

      expect(recordStore.records.value).toHaveLength(0)
      expect(recordStore.rxCount.value).toBe(0)
      expect(recordStore.txCount.value).toBe(0)
      expect(mockInstance.removeItem).toHaveBeenCalledWith('serial_records')
    })
  })

  describe('缓存状态', () => {
    it('应该正确反映缓存启用状态', () => {
      expect(recordStore.isCacheEnabled.value).toBe(true)
    })

    it('应该提供缓存统计信息', async () => {
      const mockStats = {
        recordCount: 10,
        totalKeys: 2,
        estimatedSize: 1024,
        formattedSize: '1 KB',
      }

      mockInstance.keys.mockResolvedValue(['serial_records'])
      mockInstance.length.mockResolvedValue(1)
      mockInstance.getItem.mockResolvedValue(Array.from({ length: 10 }, () => ({ type: 'read', data: [1] })))

      const stats = await recordStore.getCacheStats()

      expect(stats).toMatchObject({
        recordCount: expect.any(Number),
        totalKeys: expect.any(Number),
        estimatedSize: expect.any(Number),
        formattedSize: expect.any(String),
      })
    })
  })

  describe('性能优化', () => {
    it('应该处理大量记录而不阻塞UI', async () => {
      vi.useFakeTimers()

      // 添加大量记录
      for (let i = 0; i < 1000; i++) {
        recordStore.addRecord({
          type: i % 2 === 0 ? 'read' : 'write',
          data: new Uint8Array([i % 256]),
          time: Date.now() + i,
          display: 'hex',
        })
      }

      expect(recordStore.records.value).toHaveLength(1000)

      // 等待防抖时间
      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()

      // 应该只调用一次 setItem（防抖效果）
      expect(mockInstance.setItem).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理缓存加载错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockInstance.getItem.mockRejectedValue(new Error('Storage error'))

      // 重新创建store实例以避免自动加载的影响
      const freshRecordStore = useRecordStore()
      freshRecordStore.records.value = []
      freshRecordStore.rxCount.value = 0
      freshRecordStore.txCount.value = 0
      freshRecordStore.isLoadedFromCache.value = false

      await freshRecordStore.loadRecordsFromCacheStore()

      expect(consoleSpy).toHaveBeenCalledWith('从缓存加载记录失败:', expect.any(Error))
      expect(freshRecordStore.records.value).toHaveLength(0)

      consoleSpy.mockRestore()
    })

    it('应该优雅处理缓存保存错误', async () => {
      vi.useFakeTimers()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockInstance.setItem.mockRejectedValue(new Error('Storage error'))

      recordStore.addRecord({
        type: 'read',
        data: new Uint8Array([1]),
        time: Date.now(),
        display: 'hex',
      })

      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith('保存记录到缓存失败:', expect.any(Error))

      consoleSpy.mockRestore()
      vi.useRealTimers()
    })
  })
})
