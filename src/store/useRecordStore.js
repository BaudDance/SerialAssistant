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
export function useRecordStore() {
  return { records, readingRecord, pinBottom };
}
