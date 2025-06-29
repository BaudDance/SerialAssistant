import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

const baudRate = useLocalStorage('baudRate', 9600, { listenToStorageChanges: false })
const defaultBaudRateList = [9600, 19200, 38400, 57600, 115200]
const baudRateList = useLocalStorage('baudRateList', defaultBaudRateList, { listenToStorageChanges: false })
const dataBits = ref(8, { listenToStorageChanges: false })
const stopBits = ref(1, { listenToStorageChanges: false })
const parity = ref('none', { listenToStorageChanges: false })
const flowControl = ref('none', { listenToStorageChanges: false })

const readType = useLocalStorage('readType', 'hex', { listenToStorageChanges: false })
const sendType = useLocalStorage('sendType', 'hex', { listenToStorageChanges: false })

const hasDecTyps = useLocalStorage('hasDecTyps', false)

const recordTypes = computed(() => {
  const types = ['hex', 'ascii']
  if (hasDecTyps.value) {
    types.push('dec')
  }
  return types
})

function nextReadType() {
  const index = recordTypes.value.indexOf(readType.value)
  readType.value = recordTypes.value[(index + 1) % recordTypes.value.length]
}
function nextSendType() {
  const index = recordTypes.value.indexOf(sendType.value)
  sendType.value = recordTypes.value[(index + 1) % recordTypes.value.length]
}
export const useSerialStore = createGlobalState(() => {
  return {
    baudRate,
    defaultBaudRateList,
    baudRateList,
    dataBits,
    stopBits,
    parity,
    flowControl,
    readType,
    sendType,
    recordTypes,
    nextReadType,
    nextSendType,
    hasDecTyps,
  }
})
