import { ref } from "vue";

const baudRate = ref(9600);
const dataBits = ref(8);
const stopBits = ref(1);
const parity = ref("none");
const flowControl = ref("none");

export function useSerialStore() {
  return {
    baudRate,
    dataBits,
    stopBits,
    parity,
    flowControl,
  };
}
