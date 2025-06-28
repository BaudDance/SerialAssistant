import { ref } from 'vue'

const bleTypes = ref([
  {
    name: '通用Ⅰ型',
    description: '适用于DX-BT24等常见蓝牙串口透传模块',
    service: 0xFFE0,
    writeCharacteristic: 0xFFE1,
    notifyCharacteristic: 0xFFE1,
  },
  {
    name: '通用Ⅱ型',
    description: '适用于DX-BT16等蓝牙串口透传模块',
    service: 0xFFE0,
    writeCharacteristic: 0xFFE2,
    notifyCharacteristic: 0xFFE1,
  },
])

const bleType = ref(bleTypes.value[0])
export function useBleStore() {
  return { bleTypes, bleType }
}
