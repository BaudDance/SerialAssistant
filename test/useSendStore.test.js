import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSendStore } from '../src/store/useSendStore.js'

// 创建全局的mock records
const mockRecords = ref([])

// Mock dependencies
vi.mock('@vueuse/core', () => ({
  createGlobalState: fn => fn,
  useMagicKeys: () => ({
    'Enter': ref(false),
    'Ctrl+S': ref(false),
    'Up': ref(false),
    'Down': ref(false),
  }),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(() => ({
      sendHex: vi.fn(),
    })),
  }
})

vi.mock('@/composables/useCheckDigit/useCheckDigit', () => ({
  useCheckDigit: () => ({
    checkAlgorithm: ref(null),
    checkAlgorithms: ref([]),
  }),
}))

vi.mock('@/composables/useDataCode/useDataCode', () => ({
  useDataCode: () => ({
    decStringToBuffer: vi.fn(),
    hexStringToBuffer: vi.fn(),
    stringToBuffer: vi.fn(),
    stringToHexString: vi.fn(),
    isHexString: vi.fn(),
    bufferToHexFormat: vi.fn(data => Array.from(data).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')),
  }),
}))

vi.mock('@/store/useRecordStore', () => ({
  useRecordStore: () => ({
    records: mockRecords,
    addRecord: vi.fn(),
  }),
}))

vi.mock('@/store/useSerialStore', () => ({
  useSerialStore: () => ({
    sendType: ref('ascii'),
  }),
}))

vi.mock('@/store/useSettingStore', () => ({
  useSettingStore: () => ({
    lineEnding: ref('\r\n'),
    deviceType: ref('serial'),
    sendHexInputMode: ref('space'),
  }),
}))

describe('useSendStore - 历史导航功能', () => {
  let store

  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()

    // 设置模拟的历史记录
    mockRecords.value = [
      {
        type: 'write',
        data: new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]), // "Hello"
        time: new Date('2025-01-01T10:00:00'),
        display: 'ascii',
      },
      {
        type: 'write',
        data: new Uint8Array([0x57, 0x6F, 0x72, 0x6C, 0x64]), // "World"
        time: new Date('2025-01-01T10:01:00'),
        display: 'ascii',
      },
      {
        type: 'write',
        data: new Uint8Array([0x01, 0x02, 0x03]),
        time: new Date('2025-01-01T10:02:00'),
        display: 'hex',
      },
    ]

    store = useSendStore()
  })

  describe('historyIndex 状态管理', () => {
    it('应该初始化 historyIndex 为 -1', () => {
      expect(store.historyIndex?.value || -1).toBe(-1)
    })

    it('resetHistoryIndex 应该将 historyIndex 重置为 -1', () => {
      // 模拟设置一个非-1的值
      if (store.historyIndex) {
        store.historyIndex.value = 2
      }

      store.resetHistoryIndex()
      expect(store.historyIndex?.value || -1).toBe(-1)
    })
  })

  describe('navigateHistory 函数', () => {
    beforeEach(() => {
      // 确保有历史记录
      mockRecords.value = [
        {
          type: 'write',
          data: new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]), // "Hello"
          time: new Date('2025-01-01T10:00:00'),
          display: 'ascii',
        },
        {
          type: 'write',
          data: new Uint8Array([0x57, 0x6F, 0x72, 0x6C, 0x64]), // "World"
          time: new Date('2025-01-01T10:01:00'),
          display: 'ascii',
        },
        {
          type: 'write',
          data: new Uint8Array([0x01, 0x02, 0x03]),
          time: new Date('2025-01-01T10:02:00'),
          display: 'hex',
        },
      ]
    })

    it('应该在没有历史记录时不执行任何操作', () => {
      mockRecords.value = []
      const initialSendData = store.sendData.value

      store.navigateHistory?.('up')
      expect(store.sendData.value).toBe(initialSendData)
    })

    it('按上键应该从当前输入状态(-1)跳转到最新历史记录(0)', () => {
      // 初始状态：historyIndex = -1
      store.resetHistoryIndex()

      store.navigateHistory?.('up')

      // 应该跳转到最新的历史记录（索引0，对应数组最后一个元素）
      expect(store.historyIndex?.value).toBe(0)
      // sendData应该被设置为最新历史记录的内容
      expect(store.sendData.value).toBe('01 02 03') // hex格式的最新记录
    })

    it('按上键应该向更早的历史记录导航', () => {
      // 设置为最新记录
      if (store.historyIndex) {
        store.historyIndex.value = 0
      }

      store.navigateHistory?.('up')

      expect(store.historyIndex?.value).toBe(1)
      expect(store.sendData.value).toBe('World') // 第二新的记录
    })

    it('按上键在最早记录时应该保持不变', () => {
      // 设置为最早记录
      if (store.historyIndex) {
        store.historyIndex.value = 2 // 最大索引
      }

      store.navigateHistory?.('up')

      expect(store.historyIndex?.value).toBe(2) // 应该保持不变
      expect(store.sendData.value).toBe('Hello') // 最早的记录
    })

    it('按下键应该向更新的历史记录导航', () => {
      // 设置为中间记录
      if (store.historyIndex) {
        store.historyIndex.value = 2
      }

      store.navigateHistory?.('down')

      expect(store.historyIndex?.value).toBe(1)
      expect(store.sendData.value).toBe('World')
    })

    it('按下键从最新记录(0)应该回到当前输入状态(-1)', () => {
      // 设置为最新记录
      if (store.historyIndex) {
        store.historyIndex.value = 0
      }

      store.navigateHistory?.('down')

      expect(store.historyIndex?.value).toBe(-1)
      expect(store.sendData.value).toBe('') // 应该清空输入
    })

    it('按下键在当前输入状态(-1)时应该保持不变', () => {
      // 确保在当前输入状态
      store.resetHistoryIndex()

      store.navigateHistory?.('down')

      expect(store.historyIndex?.value).toBe(-1)
      expect(store.sendData.value).toBe('') // 应该保持空
    })
  })

  describe('不同数据格式的历史记录处理', () => {
    beforeEach(() => {
      mockRecords.value = [
        {
          type: 'write',
          data: new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x0D, 0x0A]), // "Hello\r\n"
          time: new Date('2025-01-01T10:00:00'),
          display: 'ascii',
        },
        {
          type: 'write',
          data: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
          time: new Date('2025-01-01T10:01:00'),
          display: 'hex',
        },
        {
          type: 'write',
          data: new Uint8Array([10, 20, 30]),
          time: new Date('2025-01-01T10:02:00'),
          display: 'dec',
        },
      ]
    })

    it('应该正确处理最新的DEC格式历史记录', () => {
      // 从当前输入状态按上键，应该显示最新的记录（dec格式）
      store.navigateHistory?.('up')

      // 应该显示最新的dec格式记录
      expect(store.sendData.value).toBe('10 20 30')
    })

    it('应该正确处理HEX格式的历史记录', () => {
      // 先按上键到最新记录，再按上键到第二新的记录（hex格式）
      store.navigateHistory?.('up') // 到最新记录
      store.navigateHistory?.('up') // 到第二新记录

      // 应该显示hex格式记录
      expect(store.sendData.value).toBe('01 02 03 04')
    })

    it('应该正确处理最早的ASCII格式历史记录', () => {
      // 导航到最早的记录（Hello - ascii）
      store.navigateHistory?.('up') // 到最新记录
      store.navigateHistory?.('up') // 到第二新记录
      store.navigateHistory?.('up') // 到最早记录

      // 应该显示Hello记录（移除行结束符）
      expect(store.sendData.value).toBe('Hello')
    })
  })

  describe('onInput 函数与历史索引重置', () => {
    it('onInput 应该重置历史索引', () => {
      // 设置一个非-1的历史索引
      if (store.historyIndex) {
        store.historyIndex.value = 2
      }

      store.onInput()

      expect(store.historyIndex?.value).toBe(-1)
    })

    it('onInput 应该在用户手动输入时重置历史导航状态', () => {
      // 模拟用户通过上键导航到历史记录
      store.navigateHistory?.('up')
      expect(store.historyIndex?.value).toBe(0)

      // 模拟用户手动输入
      store.onInput()

      // 历史索引应该被重置
      expect(store.historyIndex?.value).toBe(-1)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理空的历史记录数组', () => {
      mockRecords.value = []

      store.navigateHistory?.('up')
      store.navigateHistory?.('down')

      expect(store.historyIndex?.value).toBe(-1)
      expect(store.sendData.value).toBe('')
    })

    it('应该处理只有一条历史记录的情况', () => {
      mockRecords.value = [
        {
          type: 'write',
          data: new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]),
          time: new Date(),
          display: 'ascii',
        },
      ]

      // 从当前输入状态按上键
      store.navigateHistory?.('up')
      expect(store.historyIndex?.value).toBe(0)
      expect(store.sendData.value).toBe('Hello')

      // 再按上键应该保持不变
      store.navigateHistory?.('up')
      expect(store.historyIndex?.value).toBe(0)

      // 按下键应该回到当前输入状态
      store.navigateHistory?.('down')
      expect(store.historyIndex?.value).toBe(-1)
      expect(store.sendData.value).toBe('')
    })

    it('应该处理无效的导航方向', () => {
      const initialIndex = store.historyIndex?.value || -1
      const initialSendData = store.sendData.value

      store.navigateHistory?.('invalid')

      expect(store.historyIndex?.value).toBe(initialIndex)
      expect(store.sendData.value).toBe(initialSendData)
    })
  })
})
