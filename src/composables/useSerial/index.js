import { useSupported } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import USBJson from '@/assets/usb-device.json'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useNprogress } from '@/composables/useNprogress'
import { useRecordCache } from '@/composables/useRecordCache'
import { useSerialWorker } from '@/composables/useSerialWorker'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import { hasWebSerial } from '@/utils/browserSupport'

/**
 * Get device name from USBJson
 * @param {SerialPort} port
 * @returns device display name
 */
export function getDeviceName(port) {
  if (!port)
    return undefined
  const { usbProductId, usbVendorId } = port.getInfo()
  if (!usbVendorId)
    return undefined
  const vendor = USBJson[usbVendorId.toString(16).padStart(4, '0')]
  if (!vendor)
    return undefined
  const product = vendor.devices[usbProductId?.toString(16)?.padStart(4, '0')]
  return product ? product.devname : undefined
}

export function useSerial() {
  const nprogress = useNprogress()
  const worker = useSerialWorker()
  const { readType } = useSerialStore()
  const { recordCacheEnabled } = useSettingStore()
  const { dataCode } = useDataCode()
  const isSupported = useSupported(() => hasWebSerial())
  const port = ref(undefined)
  const portName = computed(() => getDeviceName(port.value))
  const ports = ref([])
  const connected = ref(false)
  const connecting = ref(false)
  const disconnecting = ref(false)
  let cleanupSerialDisconnectListener = null

  function getSerial() {
    if (!hasWebSerial())
      return null

    return navigator.serial
  }

  const portInfo = computed(() => {
    if (!port.value)
      return null
    const info = port.value.getInfo()
    return {
      port: info.usbProductId ? `USB-${info.usbVendorId?.toString(16)?.padStart(4, '0')}-${info.usbProductId?.toString(16)?.padStart(4, '0')}` : 'Unknown',
      path: info.path || 'Unknown',
      displayName: portName.value,
      friendlyName: portName.value || 'Serial Device',
      vendorId: info.usbVendorId,
      productId: info.usbProductId,
      serialNumber: info.serialNumber,
    }
  })

  async function updatePorts() {
    const serial = getSerial()
    if (!serial)
      return
    ports.value = await serial.getPorts()
  }

  async function requestPort(options = {}) {
    const serial = getSerial()
    if (!serial) {
      console.warn('Web Serial API 不支持')
      return null
    }
    try {
      connecting.value = true
      nprogress.start()
      const p = await serial.requestPort(options)
      if (p) {
        port.value = p
        await updatePorts()
        return p
      }
      return null
    }
    catch (error) {
      console.error(error)
      return null
    }
    finally {
      connecting.value = false
      nprogress.done()
    }
  }

  function setPort(p) {
    port.value = p
  }

  async function updateWorkerSettings() {
    await worker.updateSettings({
      readDisplay: readType.value,
      dataCode: dataCode.value,
      recordCacheEnabled: recordCacheEnabled.value,
    })
  }

  async function updateCurrentSessionDevice() {
    try {
      const { updateCurrentSessionDevice, createDeviceInfo, currentSessionId } = useRecordCache()
      if (portInfo.value && currentSessionId.value) {
        const deviceInfo = createDeviceInfo(
          'serial',
          portInfo.value.port,
          portInfo.value.friendlyName,
          {
            vendorId: portInfo.value.vendorId,
            productId: portInfo.value.productId,
            serialNumber: portInfo.value.serialNumber,
            path: portInfo.value.path,
          },
        )
        await updateCurrentSessionDevice(currentSessionId.value, deviceInfo)
      }
    }
    catch (error) {
      console.warn('更新会话设备信息失败:', error)
    }
  }

  function waitForSerialRelease() {
    return new Promise(resolve => setTimeout(resolve, 50))
  }

  async function closeSerialPortObject() {
    const activePort = port.value
    if (!activePort)
      return

    try {
      await activePort.close()
    }
    catch (error) {
      await waitForSerialRelease()
      try {
        await activePort.close()
      }
      catch (retryError) {
        console.warn('首次关闭串口对象失败:', error)
        throw retryError
      }
    }
  }

  async function openPort(options = { baudRate: 9600 }) {
    if (!port.value)
      throw new Error('请先选择串口设备')

    try {
      connecting.value = true
      await updateWorkerSettings()
      await port.value.open(options)
      await worker.attachSerialStreams({
        readable: port.value.readable,
        writable: port.value.writable,
        sessionId: worker.currentSessionId.value,
        readDisplay: readType.value,
        dataCode: dataCode.value,
        recordCacheEnabled: recordCacheEnabled.value,
      }, [port.value.readable, port.value.writable])
      connected.value = true
      await updateCurrentSessionDevice()
    }
    catch (error) {
      console.error('打开串口时出现错误:', error)
      try {
        await worker.closeSerialStreams()
      }
      catch (closeWorkerError) {
        console.warn('打开失败后清理串口 Worker 失败:', closeWorkerError)
      }
      try {
        await closeSerialPortObject()
      }
      catch (closePortError) {
        console.warn('打开失败后关闭串口对象失败:', closePortError)
      }
      connected.value = false
      throw error
    }
    finally {
      connecting.value = false
    }
  }

  async function reopenPort(options = { baudRate: 9600 }) {
    await closePort()
    await openPort(options)
  }

  async function closePort({ forceDisconnected = false } = {}) {
    disconnecting.value = true
    nprogress.start()
    let closeError = null
    try {
      try {
        await worker.closeSerialStreams()
      }
      catch (error) {
        console.warn('关闭串口 Worker 流失败:', error)
        closeError ||= error
      }
      try {
        await closeSerialPortObject()
      }
      catch (error) {
        console.error('关闭串口对象失败:', error)
        closeError ||= error
      }
      if (closeError && !forceDisconnected) {
        connected.value = true
        throw closeError
      }
      connected.value = false
    }
    finally {
      disconnecting.value = false
      nprogress.done()
    }
  }

  async function sendHex(hexBuffer) {
    await worker.sendSerial(hexBuffer)
  }

  watch([readType, dataCode, recordCacheEnabled], () => {
    updateWorkerSettings().catch(error => console.warn('更新串口 Worker 设置失败:', error))
  }, { immediate: true })

  async function handleSerialDisconnect(event) {
    if (port.value === event.target)
      await closePort({ forceDisconnected: true })
  }

  watch(isSupported, (supported) => {
    const serial = getSerial()
    if (!supported || !serial || cleanupSerialDisconnectListener)
      return

    serial.addEventListener('disconnect', handleSerialDisconnect)
    cleanupSerialDisconnectListener = () => {
      serial.removeEventListener('disconnect', handleSerialDisconnect)
    }
    updatePorts()
  }, { immediate: true })

  onBeforeUnmount(() => {
    cleanupSerialDisconnectListener?.()
  })

  return {
    isSupported,
    requestPort,
    setPort,
    port,
    portName,
    portInfo,
    ports,
    openPort,
    reopenPort,
    closePort,
    sendHex,
    connected,
    connecting,
    disconnecting,
    isConnected: connected,
    setTerminalActive: worker.setTerminalActive,
    onTerminalData: worker.onTerminalData,
    ackTerminalData: worker.ackTerminalData,
  }
}
