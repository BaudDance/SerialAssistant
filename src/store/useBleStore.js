import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export const CUSTOM_GATT_TYPE_NAME = '自定义 GATT'

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
  {
    name: CUSTOM_GATT_TYPE_NAME,
    description: '使用自定义 GATT 服务和特征值 UUID',
    custom: true,
  },
])

const bleSelected = ref(bleTypes.value[0].name)
const customServiceUuid = useLocalStorage('BleGatt:ServiceUuid', '')
const customWriteCharacteristicUuid = useLocalStorage('BleGatt:WriteCharacteristicUuid', '')
const customNotifyCharacteristicUuid = useLocalStorage('BleGatt:NotifyCharacteristicUuid', '')

const bleType = computed(() => {
  const selectedType = bleTypes.value.find(t => t.name === bleSelected.value) || bleTypes.value[0]
  if (!selectedType.custom)
    return selectedType

  return {
    ...selectedType,
    service: customServiceUuid.value,
    writeCharacteristic: customWriteCharacteristicUuid.value,
    notifyCharacteristic: customNotifyCharacteristicUuid.value,
  }
})

export function useBleStore() {
  return {
    bleTypes,
    bleSelected,
    bleType,
    customServiceUuid,
    customWriteCharacteristicUuid,
    customNotifyCharacteristicUuid,
  }
}
