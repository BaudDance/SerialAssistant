import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBle } from '../src/composables/useBle'

vi.mock('@vueuse/core', () => ({
  useSupported: () => ({ value: true }),
}))

vi.mock('@/composables/useNprogress', () => ({
  useNprogress: () => ({
    start: vi.fn(),
    done: vi.fn(),
  }),
}))

vi.mock('@/composables/useRecordCache', () => ({
  useRecordCache: () => ({
    currentSessionId: { value: null },
    createDeviceInfo: vi.fn(),
    updateCurrentSessionDevice: vi.fn(),
  }),
}))

const CUSTOM_PROFILE = {
  custom: true,
  service: 'FFE0',
  writeCharacteristic: 'FFE1',
  notifyCharacteristic: 'FFE2',
}

/**
 * 创建可配置的 Web Bluetooth GATT 测试替身
 * @param {object} options 特征能力配置
 * @param {boolean} [options.write] 是否支持带响应写入
 * @param {boolean} [options.writeWithoutResponse] 是否支持无响应写入
 * @param {boolean} [options.notify] 是否支持通知
 * @returns {object} 设备、服务、特征和事件监听器测试替身
 */
function createGattMocks({ write = true, writeWithoutResponse = true, notify = true } = {}) {
  const deviceListeners = new Map()
  const characteristicListeners = new Map()
  const writeCharacteristic = {
    properties: { write, writeWithoutResponse },
    writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
    writeValueWithResponse: vi.fn().mockResolvedValue(undefined),
  }
  const notifyCharacteristic = {
    properties: { notify, indicate: false },
    startNotifications: vi.fn().mockResolvedValue(undefined),
    stopNotifications: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn((name, listener) => characteristicListeners.set(name, listener)),
    removeEventListener: vi.fn((name, listener) => {
      if (characteristicListeners.get(name) === listener)
        characteristicListeners.delete(name)
    }),
  }
  const service = {
    getCharacteristic: vi.fn(async uuid => uuid === 0xFFE1 ? writeCharacteristic : notifyCharacteristic),
  }
  const server = {
    getPrimaryService: vi.fn().mockResolvedValue(service),
  }
  const gatt = {
    connected: false,
    connect: vi.fn(async () => {
      gatt.connected = true
      return server
    }),
    disconnect: vi.fn(() => {
      gatt.connected = false
    }),
  }
  const device = {
    id: 'test-device',
    name: '测试蓝牙设备',
    gatt,
    addEventListener: vi.fn((name, listener) => deviceListeners.set(name, listener)),
    removeEventListener: vi.fn((name, listener) => {
      if (deviceListeners.get(name) === listener)
        deviceListeners.delete(name)
    }),
  }

  return {
    characteristicListeners,
    device,
    deviceListeners,
    gatt,
    notifyCharacteristic,
    server,
    service,
    writeCharacteristic,
  }
}

/**
 * 将蓝牙测试替身安装到 jsdom 的 navigator
 * @param {object} device 系统设备选择器应返回的设备
 * @returns {object} requestDevice 调用测试替身
 */
function installBluetoothMock(device) {
  const bluetooth = {
    getAvailability: vi.fn().mockResolvedValue(true),
    requestDevice: vi.fn().mockResolvedValue(device),
  }
  Object.defineProperty(globalThis.navigator, 'bluetooth', {
    configurable: true,
    value: bluetooth,
  })
  return bluetooth
}

describe('useBle GATT 连接', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete window.term
  })

  it('使用自定义服务授权请求设备并完成收发', async () => {
    const mocks = createGattMocks()
    const bluetooth = installBluetoothMock(mocks.device)
    const onReadFrame = vi.fn()
    const ble = useBle({ onReadFrame })

    await expect(ble.requestDevice(CUSTOM_PROFILE)).resolves.toBe(mocks.device)
    expect(bluetooth.requestDevice).toHaveBeenCalledWith({
      acceptAllDevices: true,
      optionalServices: [0xFFE0],
    })

    await ble.connectDevice(CUSTOM_PROFILE)
    expect(ble.connected.value).toBe(true)
    expect(mocks.server.getPrimaryService).toHaveBeenCalledWith(0xFFE0)
    expect(mocks.notifyCharacteristic.startNotifications).toHaveBeenCalledOnce()

    const notificationBuffer = Uint8Array.of(0xFF, 0x01, 0x02, 0xEE).buffer
    const notificationListener = mocks.characteristicListeners.get('characteristicvaluechanged')
    notificationListener({
      target: { value: new DataView(notificationBuffer, 1, 2) },
    })
    expect(Array.from(onReadFrame.mock.calls[0][0])).toEqual([0x01, 0x02])

    const data = Uint8Array.of(0x03, 0x04)
    await ble.sendHex(data)
    expect(mocks.writeCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(data)
  })

  it('连接初始化失败时不进入已连接状态', async () => {
    const mocks = createGattMocks({ notify: false })
    installBluetoothMock(mocks.device)
    const ble = useBle()

    await ble.requestDevice(CUSTOM_PROFILE)
    await expect(ble.connectDevice(CUSTOM_PROFILE)).rejects.toThrow('不支持 GATT 通知或指示')

    expect(ble.connected.value).toBe(false)
    expect(mocks.gatt.disconnect).toHaveBeenCalledOnce()
    expect(mocks.deviceListeners.has('gattserverdisconnected')).toBe(false)
  })

  it('支持不配置通知特征的仅写连接', async () => {
    const mocks = createGattMocks({ write: true, writeWithoutResponse: false })
    installBluetoothMock(mocks.device)
    const ble = useBle()
    const writeOnlyProfile = {
      ...CUSTOM_PROFILE,
      notifyCharacteristic: '',
    }

    await ble.requestDevice(writeOnlyProfile)
    await ble.connectDevice(writeOnlyProfile)
    await ble.sendHex(Uint8Array.of(0x05))

    expect(ble.connected.value).toBe(true)
    expect(mocks.notifyCharacteristic.startNotifications).not.toHaveBeenCalled()
    expect(mocks.writeCharacteristic.writeValueWithResponse).toHaveBeenCalledOnce()
  })

  it('主动断开时停止通知并清理监听和连接状态', async () => {
    const mocks = createGattMocks()
    installBluetoothMock(mocks.device)
    const ble = useBle()

    await ble.requestDevice(CUSTOM_PROFILE)
    await ble.connectDevice(CUSTOM_PROFILE)
    await ble.disconnectDevice()

    expect(mocks.notifyCharacteristic.stopNotifications).toHaveBeenCalledOnce()
    expect(mocks.notifyCharacteristic.removeEventListener).toHaveBeenCalledWith(
      'characteristicvaluechanged',
      expect.any(Function),
    )
    expect(mocks.gatt.disconnect).toHaveBeenCalledOnce()
    expect(ble.connected.value).toBe(false)
    await expect(ble.sendHex(Uint8Array.of(0x06))).rejects.toThrow('尚未就绪')
  })

  it('设备主动断开时清理本地状态', async () => {
    const mocks = createGattMocks()
    installBluetoothMock(mocks.device)
    const ble = useBle()

    await ble.requestDevice(CUSTOM_PROFILE)
    await ble.connectDevice(CUSTOM_PROFILE)
    mocks.gatt.connected = false
    await mocks.deviceListeners.get('gattserverdisconnected')({ target: mocks.device })

    expect(ble.connected.value).toBe(false)
    expect(mocks.notifyCharacteristic.removeEventListener).toHaveBeenCalledOnce()
    expect(mocks.notifyCharacteristic.stopNotifications).not.toHaveBeenCalled()
  })
})
