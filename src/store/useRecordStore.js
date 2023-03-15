import { ref } from "vue";
/**
 *
 * record definition:
 * {
 *  type: "read" | "write",
 *  data: Uint8Array,
 *  timestamp: Date,
 *  display: "hex" | "ascii" | "utf8",
 * }
 */
export function useRecordStore() {
  const records = ref([]);
  const readingRecord = ref(undefined);

  return { records, readingRecord };
}
