import { useLocalStorage } from "@vueuse/core";

const deviceType = useLocalStorage("deviceType", "serial", {
  listenToStorageChanges: false,
}); // serial, ble

// 行尾换行符
const lineEnding = useLocalStorage("lineEnding", "", {
  listenToStorageChanges: false,
});

// 发送输入框 hex 模式的输入模式 normal: 正常输入 format: 格式化输入
const sendHexInputMode = useLocalStorage("sendInputHexMode", "format", {
  listenToStorageChanges: false,
});
export function useSettingStore() {
  return {
    lineEnding,
    deviceType,
    sendHexInputMode,
  };
}
