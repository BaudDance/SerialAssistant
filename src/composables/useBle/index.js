import { useSupported } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import { useNprogress } from '@/composables/useNprogress'
import { useRecordCache } from '@/composables/useRecordCache'
import { createGattRequestOptions, normalizeGattProfile, writeGattValue } from '@/utils/bleGatt'

/**
 * 创建 BLE GATT 串口连接及收发状态
 * @param {object} options BLE 连接回调配置
 * @param {(data: Uint8Array) => void | Promise<void>} [options.onReadFrame] 收到通知数据时执行的回调
 * @returns {object} BLE 设备、连接状态和收发操作
 */
export function useBle(options = {}) {
  const onReadFrame = options.onReadFrame ?? (() => {})
  const isSupported = useSupported(
    async () =>
      navigator
      && 'bluetooth' in navigator
      && (await navigator.bluetooth.getAvailability()),
  )
  const nprogress = useNprogress()
  // 安全地访问 navigator.bluetooth，避免在不支持的环境中报错
  const bluetooth = (typeof navigator !== 'undefined' && 'bluetooth' in navigator) ? navigator.bluetooth : null
  const device = shallowRef(undefined)
  const deviceName = computed(() => device.value?.name)
  const server = shallowRef(undefined)
  const writeCharacteristic = shallowRef(undefined)
  const notifyCharacteristic = shallowRef(undefined)
  const connected = ref(false)
  const connecting = ref(false)
  const disconnecting = ref(false)

  /**
   * 根据 GATT 配置打开系统蓝牙设备选择器
   * @param {object} type 预设或自定义 GATT 配置
   * @returns {Promise<BluetoothDevice | null>} 用户选择的设备，取消或失败时返回 null
   */
  async function requestDevice(type) {
    if (!bluetooth) {
      console.warn('Web Bluetooth API 不支持')
      return null
    }
    try {
      connecting.value = true
      nprogress.start()
      const profile = normalizeGattProfile(type)
      const selectedDevice = await bluetooth.requestDevice(createGattRequestOptions(profile))
      if (selectedDevice) {
        if (device.value && device.value !== selectedDevice)
          device.value.removeEventListener('gattserverdisconnected', onDisconnected)
        device.value = selectedDevice
        return selectedDevice
      }
      return null
    }
    catch (error) {
      console.error('选择蓝牙设备失败:', error)
      return null
    }
    finally {
      connecting.value = false
      nprogress.done()
    }
  }

  /**
   * 将 GATT 通知数据转换为精确字节范围并交给现有接收链路
   * @param {Event} event 特征值变化事件
   * @returns {void} 此方法不返回数据
   */
  function handleCharacteristicValueChanged(event) {
    const value = event.target?.value
    if (!value)
      return

    const uint8Data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice()
    onReadFrame(uint8Data)
    if (typeof window !== 'undefined' && window.term) {
      const text = new TextDecoder('utf-8').decode(uint8Data)
      window.term.write(text)
    }
  }

  /**
   * 移除通知监听器并在连接仍有效时停止通知
   * @returns {Promise<void>} 通知资源清理完成后解决的 Promise
   */
  async function cleanupCharacteristicNotifications() {
    const characteristic = notifyCharacteristic.value
    if (!characteristic)
      return

    characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)
    if (device.value?.gatt?.connected && typeof characteristic.stopNotifications === 'function') {
      try {
        await characteristic.stopNotifications()
      }
      catch (error) {
        console.warn('停止 GATT 通知失败:', error)
      }
    }
    notifyCharacteristic.value = undefined
  }

  /**
   * 获取并校验写入和通知特征，随后启动通知监听
   * @param {object} profile 已标准化的 GATT 配置
   * @returns {Promise<void>} 特征初始化完成后解决的 Promise
   */
  async function initializeGattCharacteristics(profile) {
    const service = await server.value.getPrimaryService(profile.service)
    const nextWriteCharacteristic = await service.getCharacteristic(profile.writeCharacteristic)
    const writeProperties = nextWriteCharacteristic.properties
    if (!writeProperties?.write && !writeProperties?.writeWithoutResponse)
      throw new Error('所选写入特征不支持 GATT 写入')

    if (profile.notifyCharacteristic !== undefined) {
      const nextNotifyCharacteristic = await service.getCharacteristic(profile.notifyCharacteristic)
      const notifyProperties = nextNotifyCharacteristic.properties
      if (!notifyProperties?.notify && !notifyProperties?.indicate)
        throw new Error('所选通知特征不支持 GATT 通知或指示')

      notifyCharacteristic.value = nextNotifyCharacteristic
      await nextNotifyCharacteristic.startNotifications()
      nextNotifyCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)
    }

    writeCharacteristic.value = nextWriteCharacteristic
  }

  /**
   * 将已选设备连接到指定 GATT 串口服务并初始化收发特征
   * @param {object} type 预设或自定义 GATT 配置
   * @returns {Promise<void>} GATT 通道可收发后解决的 Promise
   */
  async function connectDevice(type) {
    if (!device.value)
      throw new Error('请先选择蓝牙设备')

    const profile = normalizeGattProfile(type)
    try {
      connecting.value = true
      connected.value = false
      await cleanupCharacteristicNotifications()
      writeCharacteristic.value = undefined
      device.value.removeEventListener('gattserverdisconnected', onDisconnected)
      server.value = await device.value.gatt.connect()
      device.value.addEventListener('gattserverdisconnected', onDisconnected)
      await initializeGattCharacteristics(profile)
      connected.value = true

      try {
        const { updateCurrentSessionDevice, createDeviceInfo, currentSessionId } = useRecordCache()
        if (currentSessionId.value) {
          const deviceInfo = createDeviceInfo(
            'bluetooth',
            device.value.id,
            device.value.name || 'Bluetooth Device',
            {
              deviceId: device.value.id,
              gatt: device.value.gatt?.connected || false,
              serviceUUID: profile.service,
              writeCharacteristicUUID: profile.writeCharacteristic,
              notifyCharacteristicUUID: profile.notifyCharacteristic,
            },
          )
          await updateCurrentSessionDevice(currentSessionId.value, deviceInfo)
        }
      }
      catch (error) {
        console.warn('更新会话设备信息失败:', error)
      }
    }
    catch (error) {
      await cleanupCharacteristicNotifications()
      writeCharacteristic.value = undefined
      server.value = undefined
      connected.value = false
      device.value.removeEventListener('gattserverdisconnected', onDisconnected)
      if (device.value.gatt?.connected)
        device.value.gatt.disconnect()
      throw error
    }
    finally {
      connecting.value = false
    }
  }

  /**
   * 通过当前 GATT 写入特征发送二进制数据
   * @param {BufferSource} data 待发送的二进制数据
   * @returns {Promise<void>} 数据写入完成后解决的 Promise
   */
  async function sendHex(data) {
    if (!writeCharacteristic.value)
      throw new Error('GATT 写入特征尚未就绪')
    await writeGattValue(writeCharacteristic.value, data)
  }

  /**
   * 处理设备主动断开事件并清理本地 GATT 状态
   * @param {Event} event GATT 服务断开事件
   * @returns {Promise<void>} 本地状态清理完成后解决的 Promise
   */
  async function onDisconnected(event) {
    if (event?.target && event.target !== device.value)
      return

    device.value?.removeEventListener('gattserverdisconnected', onDisconnected)
    await cleanupCharacteristicNotifications()
    writeCharacteristic.value = undefined
    server.value = undefined
    connected.value = false
  }

  /**
   * 主动停止通知并断开当前 GATT 连接
   * @returns {Promise<void>} 连接和本地状态均清理完成后解决的 Promise
   */
  async function disconnectDevice() {
    if (!device.value)
      return
    nprogress.start()
    disconnecting.value = true

    try {
      await cleanupCharacteristicNotifications()
      device.value.removeEventListener('gattserverdisconnected', onDisconnected)
      if (device.value.gatt?.connected)
        device.value.gatt.disconnect()
    }
    catch (error) {
      console.error('断开蓝牙连接时出现错误:', error)
      throw error
    }
    finally {
      writeCharacteristic.value = undefined
      notifyCharacteristic.value = undefined
      server.value = undefined
      connected.value = false
      disconnecting.value = false
      nprogress.done()
    }
  }

  return {
    isSupported,
    device,
    deviceName,
    connected,
    connecting,
    disconnecting,
    requestDevice,
    connectDevice,
    disconnectDevice,
    sendHex,
    isConnected: connected,
  }
}
