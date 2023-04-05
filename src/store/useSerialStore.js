import { useLocalStorage } from "@vueuse/core";
import { ref } from "vue";

const baudRate = useLocalStorage("baudRate", 9600);
const dataBits = ref(8);
const stopBits = ref(1);
const parity = ref("none");
const flowControl = ref("none");

const readType = useLocalStorage("readType", "hex");
const sendType = useLocalStorage("sendType", "hex");

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
