import { useSupported } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useNprogress } from '@/composables/useNprogress'
import { useRecordCache } from '@/composables/useRecordCache'

export function useBle(
  options = {
    onReadFrame: (data) => {},
  },
) {
  const { onReadFrame } = options
  const isSupported = useSupported(
    async () =>
      navigator
      && 'bluetooth' in navigator
      && (await navigator.bluetooth.getAvailability()),
  )
  const nprogress = useNprogress()
  // 安全地访问 navigator.bluetooth，避免在不支持的环境中报错
  const bluetooth = (typeof navigator !== 'undefined' && 'bluetooth' in navigator) ? navigator.bluetooth : null
  const device = ref(undefined)
  const deviceName = computed(() => device.value?.name)
  const server = ref(undefined)
  const writeCharacteristic = ref(undefined)
  const state = ref('disconnected') // disconnected, connecting, connected, disconnecting
  const connected = ref(false)
  const connecting = ref(false)
  const disconnecting = ref(false)

  async function requestDevice(type) {
    if (!bluetooth) {
      console.warn('Web Bluetooth API 不支持')
      return null
    }
    try {
      connecting.value = true
      nprogress.start()
      const d = await bluetooth.requestDevice({
        filters: [{ services: [type.service] }],
      })
      if (d) {
        device.value = d
        return d
      }
      console.log('requestDevice', d)
      return null
    }
    catch (e) {
      console.error(e)
      return null
    }
    finally {
      connecting.value = false
      nprogress.done()
    }
  }

  async function connectDevice(type) {
    console.log('connectDevice', device.value)
    if (!device.value)
      return
    try {
      connecting.value = true
      server.value = await device.value.gatt.connect()
      console.log('server', server.value)
      state.value = 'connected'
      connected.value = true

      // 添加断开连接事件
      device.value.addEventListener('gattserverdisconnected', onDisconnected)
      listenCharacteristic(type)

      // 连接成功后，尝试更新当前会话的设备信息
      try {
        const { updateCurrentSessionDevice, createDeviceInfo, currentSessionId } = useRecordCache()
        if (device.value && currentSessionId.value) {
          const deviceInfo = createDeviceInfo(
            'bluetooth',
            device.value.id,
            device.value.name || 'Bluetooth Device',
            {
              deviceId: device.value.id,
              gatt: device.value.gatt?.connected || false,
              serviceUUID: type.service,
            },
          )
          updateCurrentSessionDevice(currentSessionId.value, deviceInfo)
        }
      }
      catch (error) {
        console.warn('更新会话设备信息失败:', error)
      }
    }
    catch (e) {
      console.log(e)
      throw e
    }
    finally {
      connecting.value = false
    }
  }

  async function listenCharacteristic(type) {
    const service = await server.value.getPrimaryService(type.service)
    console.log('service', service)
    const characteristic = await service.getCharacteristic(
      type.notifyCharacteristic,
    )
    console.log('characteristic', characteristic)
    await characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value
      console.log(
        'characteristicvaluechanged',
        value.buffer,
        typeof value.buffer,
      )
      const uint8Data = new Uint8Array(value.buffer)
      onReadFrame(uint8Data)
      if (window.term) {
        const text = new TextDecoder('utf-8').decode(uint8Data)
        window.term.write(text)
      }
    })

    writeCharacteristic.value = await service.getCharacteristic(
      type.writeCharacteristic,
    )
  }

  async function sendHex(data) {
    if (!writeCharacteristic.value)
      return
    await writeCharacteristic.value.writeValueWithoutResponse(data)
  }

  async function onDisconnected() {
    console.log('gattserverdisconnected', event)
    state.value = 'disconnected'
    connected.value = false
  }

  async function disconnectDevice() {
    if (!device.value)
      return
    nprogress.start()
    console.log('开始断开蓝牙连接...')
    disconnecting.value = true

    try {
      // 移除事件监听器
      device.value.removeEventListener('gattserverdisconnected', onDisconnected)

      // 断开GATT连接
      if (device.value.gatt && device.value.gatt.connected) {
        console.log('断开GATT连接')
        await device.value.gatt.disconnect()
      }

      // 清理引用
      writeCharacteristic.value = undefined
      server.value = undefined

      console.log('蓝牙连接已断开')
    }
    catch (error) {
      console.error('断开蓝牙连接时出现错误:', error)
      // 即使出错也要设置为未连接状态
      state.value = 'disconnected'
      connected.value = false
    }
    finally {
      disconnecting.value = false
      nprogress.done()
    }
  }
  return {
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
