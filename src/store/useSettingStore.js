import { useLocalStorage } from "@vueuse/core";

const deviceType = useLocalStorage("deviceType", "serial", {
  listenToStorageChanges: false,
}); // serial, ble

// 行尾换行符
const lineEnding = useLocalStorage("lineEnding", "", {
  listenToStorageChanges: false,
});
export function useSettingStore() {
  return {
    lineEnding,
    deviceType,
  };
}
