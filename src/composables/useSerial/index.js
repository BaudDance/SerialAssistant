import { useSupported, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import USBJson from '@/assets/usb-device.json'
import { useNprogress } from '@/composables/useNprogress'
import { useRecordCache } from '@/composables/useRecordCache'

/**
 *  Get device name from USBJson
 * @param {SerialPort} port
 * @returns
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
  const product = vendor.devices[usbProductId.toString(16).padStart(4, '0')]
  console.debug('getDeviceName', product ? product.name : undefined)
  return product ? product.devname : undefined
}

export function useSerial(
  options = {
    onReadData: (data) => {},
    onReadFrame: (frame) => {},
  },
) {
  const { onReadData, onReadFrame } = options
  const nprogress = useNprogress()
  const isSupported = useSupported(() => navigator && 'serial' in navigator)
  // 安全地访问 navigator.serial，避免在不支持的环境中报错
  const serial = isSupported.value ? navigator.serial : null
  const port = ref(undefined)
  const portName = computed(() => getDeviceName(port.value))
  const ports = ref([])
  const connected = ref(false)
  const connecting = ref(false)
  const disconnecting = ref(false)

  // 获取端口信息
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
  let keepReading
  let readingClosed
  async function updatePorts() {
    if (!serial)
      return
    ports.value = await serial.getPorts()
  }

  async function requestPort() {
    if (!serial) {
      console.warn('Web Serial API 不支持')
      return null
    }
    try {
      connecting.value = true
      nprogress.start()
      const p = await serial.requestPort(options)
      console.debug('requestPort', p)
      if (p) {
        port.value = p
        updatePorts()
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
  let reader
  async function startReadLoop() {
    let buffer = new Uint8Array()
    const { start, stop } = useTimeoutFn(
      () => {
        onReadFrame(buffer)
        buffer = new Uint8Array()
      },
      5,
      { immediate: false },
    )
    keepReading = true
    while (port.value.readable && keepReading) {
      reader = port.value.readable.getReader()
      try {
        while (keepReading) {
          const { value, done } = await reader.read()
          if (value) {
            stop()
            buffer = new Uint8Array([...buffer, ...value])
            onReadData(value)
            if (window.term) {
              window.term.write(value)
            }
            start()
          }
          if (done) {
            reader.releaseLock()
            break
          }
        }
      }
      catch (error) {
        console.error(error)
      }
      finally {
        reader.releaseLock()
      }
    }
  }

  async function openPort(options = { baudRate: 9600 }) {
    try {
      connecting.value = true
      await port.value.open(options)
      readingClosed = startReadLoop()
      connected.value = true

      // 连接成功后，尝试更新当前会话的设备信息
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
          updateCurrentSessionDevice(currentSessionId.value, deviceInfo)
        }
      }
      catch (error) {
        console.warn('更新会话设备信息失败:', error)
      }
    }
    catch (error) {
      console.error('打开串口时出现错误:', error)
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

  async function closePort() {
    console.log('开始关闭串口连接...')
    disconnecting.value = true
    keepReading = false
    nprogress.start()
    try {
      // 取消读取操作
      if (reader) {
        console.log('取消串口读取器')
        await reader.cancel()
        reader = null
      }

      // 等待读取循环结束
      if (readingClosed) {
        console.log('等待读取循环结束')
        await readingClosed
        readingClosed = null
      }

      // 关闭串口
      if (port.value && port.value.readable) {
        console.log('关闭串口')
        await port.value.close()
      }

      connected.value = false
      console.log('串口连接已关闭')
    }
    catch (error) {
      console.error('关闭串口时出现错误:', error)
      // 即使出错也要设置为未连接状态
      connected.value = false
    }
    finally {
      disconnecting.value = false
      nprogress.done()
    }
  }
  async function sendHex(hexBuffer) {
    const writer = port.value.writable.getWriter()
    await writer.write(hexBuffer)

    // 允许稍后关闭串口。
    writer.close()
    writer.releaseLock()
  }

  // 只在支持 Web Serial API 的环境中添加事件监听器
  if (serial) {
    serial.addEventListener('disconnect', async (event) => {
      if (port.value == event.target) {
        await closePort()
      }
    })
    updatePorts()
  }
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
  }
}
