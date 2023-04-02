import { useLocalStorage } from "@vueuse/core";

// 行尾换行符
const lineEnding = useLocalStorage("lineEnding", "");
export function useSettingStore() {
  return {
    lineEnding,
  };
}
