import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('资源清理测试', () => {
  let mockConsole

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }
    global.console = mockConsole

    // Mock global functions
    global.addEventListener = vi.fn()
    global.removeEventListener = vi.fn()

    // Mock document
    global.document = {
      title: 'SerialAssistant',
    }

    // Mock navigator
    global.navigator = {
      onLine: true,
    }

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('串口资源清理逻辑', () => {
    it('应该正确清理串口连接', async () => {
      // 模拟串口对象
      const mockPort = {
        close: vi.fn().mockResolvedValue(undefined),
      }

      const mockReader = {
        cancel: vi.fn().mockResolvedValue(undefined),
        closed: Promise.resolve(),
      }

      // 模拟串口清理逻辑
      const closePort = async () => {
        console.log('🔌 开始关闭串口连接...')

        try {
          // 取消读取器
          if (mockReader) {
            await mockReader.cancel()
            await mockReader.closed
          }

          // 关闭端口
          if (mockPort) {
            await mockPort.close()
          }

          console.log('✅ 串口连接已完全关闭')
        }
        catch (error) {
          console.error('❌ 关闭串口时出错:', error)
        }
      }

      await closePort()

      // 验证清理步骤
      expect(mockReader.cancel).toHaveBeenCalled()
      expect(mockPort.close).toHaveBeenCalled()
      expect(mockConsole.log).toHaveBeenCalledWith('🔌 开始关闭串口连接...')
      expect(mockConsole.log).toHaveBeenCalledWith('✅ 串口连接已完全关闭')
    })

    it('应该处理串口关闭错误', async () => {
      const mockPort = {
        close: vi.fn().mockRejectedValue(new Error('关闭失败')),
      }

      const closePort = async () => {
        console.log('🔌 开始关闭串口连接...')

        try {
          await mockPort.close()
          console.log('✅ 串口连接已完全关闭')
        }
        catch (error) {
          console.error('❌ 关闭串口时出错:', error)
        }
      }

      await closePort()

      expect(mockPort.close).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalledWith('❌ 关闭串口时出错:', expect.any(Error))
    })
  })

  describe('蓝牙资源清理逻辑', () => {
    it('应该正确清理蓝牙连接', async () => {
      const mockDevice = {
        gatt: {
          disconnect: vi.fn(),
        },
        removeEventListener: vi.fn(),
      }

      const mockCharacteristic = {
        removeEventListener: vi.fn(),
      }

      // 模拟蓝牙清理逻辑
      const disconnectDevice = async () => {
        console.log('🔵 开始断开蓝牙连接...')

        try {
          // 移除事件监听器
          if (mockDevice) {
            mockDevice.removeEventListener('gattserverdisconnected', expect.any(Function))
          }

          if (mockCharacteristic) {
            mockCharacteristic.removeEventListener('characteristicvaluechanged', expect.any(Function))
          }

          // 断开GATT连接
          if (mockDevice?.gatt) {
            mockDevice.gatt.disconnect()
          }

          console.log('✅ 蓝牙连接已完全断开')
        }
        catch (error) {
          console.error('❌ 断开蓝牙连接时出错:', error)
        }
      }

      await disconnectDevice()

      expect(mockDevice.gatt.disconnect).toHaveBeenCalled()
      expect(mockDevice.removeEventListener).toHaveBeenCalled()
      expect(mockCharacteristic.removeEventListener).toHaveBeenCalled()
      expect(mockConsole.log).toHaveBeenCalledWith('🔵 开始断开蓝牙连接...')
      expect(mockConsole.log).toHaveBeenCalledWith('✅ 蓝牙连接已完全断开')
    })
  })

  describe('网络状态监听器清理', () => {
    it('应该正确添加和移除网络监听器', () => {
      const offlinePrefix = '[Offline] '

      // 模拟网络监听器逻辑
      const listenNetworkStatus = () => {
        const offlineHandler = () => {
          console.log('Network: Offline')
          document.title = offlinePrefix + document.title
        }

        const onlineHandler = () => {
          console.log('Network: Online')
          document.title = document.title.replace(offlinePrefix, '')
        }

        addEventListener('offline', offlineHandler)
        addEventListener('online', onlineHandler)

        // Initial title
        if (!navigator.onLine) {
          document.title = offlinePrefix + document.title
        }

        // 返回清理函数
        return () => {
          removeEventListener('offline', offlineHandler)
          removeEventListener('online', onlineHandler)
          console.log('Network status listeners removed')
        }
      }

      const cleanup = listenNetworkStatus()

      // 验证监听器被添加
      expect(global.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(global.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))

      // 调用清理函数
      cleanup()

      // 验证监听器被移除
      expect(global.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(global.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockConsole.log).toHaveBeenCalledWith('Network status listeners removed')
    })

    it('应该正确更新离线状态标题', () => {
      global.navigator.onLine = false
      const offlinePrefix = '[Offline] '

      const listenNetworkStatus = () => {
        // Initial title
        if (!navigator.onLine) {
          document.title = offlinePrefix + document.title
        }
      }

      listenNetworkStatus()

      expect(document.title).toBe('[Offline] SerialAssistant')
    })
  })

  describe('定时器清理逻辑', () => {
    it('应该正确清理定时器', () => {
      let timerId = 0
      const mockSetInterval = vi.fn(() => ++timerId)
      const mockClearInterval = vi.fn()

      global.setInterval = mockSetInterval
      global.clearInterval = mockClearInterval

      // 模拟定时器管理
      const createTimerManager = () => {
        const timers = new Set()

        const addTimer = (callback, delay) => {
          const id = setInterval(callback, delay)
          timers.add(id)
          return id
        }

        const cleanup = () => {
          timers.forEach((id) => {
            clearInterval(id)
          })
          timers.clear()
        }

        return { addTimer, cleanup, getTimerCount: () => timers.size }
      }

      const manager = createTimerManager()

      // 添加定时器
      manager.addTimer(() => {}, 1000)
      manager.addTimer(() => {}, 2000)

      expect(manager.getTimerCount()).toBe(2)
      expect(mockSetInterval).toHaveBeenCalledTimes(2)

      // 清理定时器
      manager.cleanup()

      expect(manager.getTimerCount()).toBe(0)
      expect(mockClearInterval).toHaveBeenCalledTimes(2)
    })
  })

  describe('页面卸载事件处理', () => {
    it('应该正确处理beforeunload事件', () => {
      const mockAddEventListener = vi.fn()
      global.addEventListener = mockAddEventListener

      // 模拟页面卸载处理
      const setupBeforeUnloadHandler = () => {
        const handleBeforeUnload = () => {
          console.log('页面即将卸载，清理资源...')
          // 这里会调用各种清理函数
        }

        addEventListener('beforeunload', handleBeforeUnload)

        return handleBeforeUnload
      }

      const handler = setupBeforeUnloadHandler()

      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', handler)

      // 模拟触发事件
      handler()

      expect(mockConsole.log).toHaveBeenCalledWith('页面即将卸载，清理资源...')
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该处理空对象的清理', async () => {
      const safeCleanup = async (resource, cleanupFn) => {
        try {
          if (resource && typeof cleanupFn === 'function') {
            await cleanupFn()
          }
        }
        catch (error) {
          console.error('清理资源时出错:', error)
        }
      }

      // 测试空对象
      await safeCleanup(null, null)
      await safeCleanup(undefined, undefined)

      // 测试有效对象
      const mockResource = { close: vi.fn() }
      await safeCleanup(mockResource, () => mockResource.close())

      expect(mockResource.close).toHaveBeenCalled()
    })

    it('应该处理重复清理调用', () => {
      let isCleanedUp = false

      const cleanup = () => {
        if (isCleanedUp) {
          console.log('资源已经清理过了')
          return
        }

        console.log('正在清理资源...')
        isCleanedUp = true
      }

      // 第一次清理
      cleanup()
      expect(mockConsole.log).toHaveBeenCalledWith('正在清理资源...')

      // 第二次清理
      cleanup()
      expect(mockConsole.log).toHaveBeenCalledWith('资源已经清理过了')
    })
  })

  describe('资源泄露检测', () => {
    it('应该检测未清理的资源', () => {
      const resourceTracker = {
        resources: new Set(),

        addResource(resource) {
          this.resources.add(resource)
        },

        removeResource(resource) {
          this.resources.delete(resource)
        },

        getLeakedResources() {
          return Array.from(this.resources)
        },

        hasLeaks() {
          return this.resources.size > 0
        },
      }

      // 添加资源
      resourceTracker.addResource('port1')
      resourceTracker.addResource('device1')
      resourceTracker.addResource('timer1')

      expect(resourceTracker.hasLeaks()).toBe(true)
      expect(resourceTracker.getLeakedResources()).toHaveLength(3)

      // 清理部分资源
      resourceTracker.removeResource('port1')

      expect(resourceTracker.hasLeaks()).toBe(true)
      expect(resourceTracker.getLeakedResources()).toHaveLength(2)

      // 清理所有资源
      resourceTracker.removeResource('device1')
      resourceTracker.removeResource('timer1')

      expect(resourceTracker.hasLeaks()).toBe(false)
      expect(resourceTracker.getLeakedResources()).toHaveLength(0)
    })
  })
})
