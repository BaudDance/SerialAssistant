import { createGlobalState } from '@vueuse/core'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useRecordCache } from '@/composables/useRecordCache'
import { useSettingStore } from '@/store/useSettingStore'
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
const records = ref([])
const readingRecord = ref(undefined)
const pinBottom = ref(true)
const scrollToRecordIndex = ref(-1) // 用于触发滚动到指定记录

const rxCount = ref(0)
const txCount = ref(0)

const { recordCacheEnabled } = useSettingStore()

// 初始化会话缓存
const {
  debouncedSaveSessionRecords,
  currentSessionId,
} = useRecordCache()

function addRecord(record) {
  records.value.push(record)
  rxCount.value += record.type === 'read' ? record.data.length : 0
  txCount.value += record.type === 'write' ? record.data.length : 0

  // 防抖保存到当前会话
  if (recordCacheEnabled.value && currentSessionId.value) {
    debouncedSaveSessionRecords(records.value, currentSessionId.value)
  }
}

function clearRecords() {
  records.value = []
  rxCount.value = 0
  txCount.value = 0
}

export const useRecordStore = createGlobalState(() => {
  const { bufferToDecFormat, bufferToHexFormat, bufferToString, stringToHtml } = useDataCode()

  function exportRecords(list = records.value) {
    if (!list.length) {
      toast.error('记录为空，导出失败')
      return
    }

    const exportData = list.map((record) => {
      const type = record.type
      const timestamp = record.timestamp || new Date(record.time).getTime() || null
      const time = timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS') : null
      const display = record.display
      const data = record.display === 'hex' ? bufferToHexFormat(record.data) : bufferToString(record.data)

      return {
        type,
        data,
        timestamp,
        time,
        display,
      }
    })

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const fileName = `records-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  async function copyRecordContent(record) {
    let content = ''
    if (record.display === 'hex') {
      content = bufferToHexFormat(record.data)
    }
    else if (record.display === 'ascii') {
      content = bufferToString(record.data)
    }
    else {
      content = bufferToDecFormat(record.data)
    }

    try {
      await navigator.clipboard.writeText(content)
      toast.success('复制消息内容成功')
    }
    catch (err) {
      console.error('复制失败:', err)
      toast.error('复制消息内容失败')
    }
  }

  function scrollToRecord(index) {
    scrollToRecordIndex.value = index
    // 重置滚动索引，避免重复触发
    setTimeout(() => {
      scrollToRecordIndex.value = -1
    }, 100)
  }

  return {
    records,
    readingRecord,
    pinBottom,
    scrollToRecordIndex,
    rxCount,
    txCount,
    addRecord,
    clearRecords,
    exportRecords,
    copyRecordContent,
    scrollToRecord,
  }
})
