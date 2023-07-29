import { computedAsync, useLocalStorage } from '@vueuse/core';

const deviceType = useLocalStorage('deviceType', 'serial', {
  listenToStorageChanges: false
}); // serial, ble

const lineEndingMode = useLocalStorage('lineEndingMode', '', {
  listenToStorageChanges: false
});
const lineSelfEnding = useLocalStorage('lineSelfEnding', '', {
  listenToStorageChanges: false
});

// 行尾换行符
const lineEnding = computedAsync(async () => {
  console.log(lineEndingMode.value, lineSelfEnding.value);
  return lineEndingMode.value ?? lineSelfEnding.value;
});

// 发送输入框 hex 模式的输入模式 normal: 正常输入 format: 格式化输入
const sendHexInputMode = useLocalStorage('sendInputHexMode', 'format', {
  listenToStorageChanges: false
});
export function useSettingStore () {
  return {
    lineEndingMode,
    lineSelfEnding,
    lineEnding,
    deviceType,
    sendHexInputMode
  };
}
