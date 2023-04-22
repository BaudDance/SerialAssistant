import { useLocalStorage } from "@vueuse/core";
import { ref } from "vue";

const baudRate = useLocalStorage("baudRate", 9600, {
  listenToStorageChanges: false,
});
const dataBits = ref(8, {
  listenToStorageChanges: false,
});
const stopBits = ref(1, {
  listenToStorageChanges: false,
});
const parity = ref("none", {
  listenToStorageChanges: false,
});
const flowControl = ref("none", {
  listenToStorageChanges: false,
});

const readType = useLocalStorage("readType", "hex", {
  listenToStorageChanges: false,
});
const sendType = useLocalStorage("sendType", "hex", {
  listenToStorageChanges: false,
});

export function useSerialStore() {
  return {
    baudRate,
    dataBits,
    stopBits,
    parity,
    flowControl,
    readType,
    sendType,
  };
}
