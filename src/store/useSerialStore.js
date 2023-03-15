import { ref } from "vue";

const baudRate = ref(9600);
const dataBits = ref(8);
const stopBits = ref(1);
const parity = ref("none");
const flowControl = ref("none");

const readType = ref("hex");
const sendType = ref("hex");

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
