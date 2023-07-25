import { ref } from "vue";
// 校验算法 'checksum'
const checkAlgorithm = ref(undefined);

const checkAlgorithms = ref([
  {
    name: "校验和",
    algorithm: (data) => {
      console.log("校验和", data);
      return Uint8Array.from([data.reduce((a, b) => a + b, 0) & 0xff]);
    },
  },
]);

export function useCheckDigit() {
  return {
    checkAlgorithm,
    checkAlgorithms,
  };
}
