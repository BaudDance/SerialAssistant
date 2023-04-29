import { ref } from "vue";
const bleTypes = ref([
  {
    name: "通用Ⅰ型",
    description: "适用于DX-BT24等常见蓝牙串口透传模块",
    service: 0xffe0,
    writeCharacteristic: 0xffe1,
    notifyCharacteristic: 0xffe1,
  },
  {
    name: "通用Ⅱ型",
    description: "适用于DX-BT16等蓝牙串口透传模块",
    service: 0xffe0,
    writeCharacteristic: 0xffe2,
    notifyCharacteristic: 0xffe1,
  },
]);

const bleType = ref(bleTypes.value[0]);
export function useBleStore() {
  return { bleTypes, bleType };
}
