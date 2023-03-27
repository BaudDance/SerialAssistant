import { ref } from "vue";
/**
 *
 * record definition:
 * {
 *  type: "read" | "write" |"system"",
 *  data: Uint8Array,
 *  timestamp: Date,
 *  display: "hex" | "ascii",
 * }
 */
const records = ref([]);
const readingRecord = ref(undefined);
const pinBottom = ref(true);

const rxCount = ref(0);
const txCount = ref(0);

function addRecord(record) {
  records.value.push(record);
  rxCount.value += record.type === "read" ? record.data.length : 0;
  txCount.value += record.type === "write" ? record.data.length : 0;
}

function clearRecords() {
  records.value = [];
  rxCount.value = 0;
  txCount.value = 0;
}
export function useRecordStore() {
  return {
    records,
    readingRecord,
    pinBottom,
    rxCount,
    txCount,
    addRecord,
    clearRecords,
  };
}
