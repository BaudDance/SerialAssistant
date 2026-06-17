import { createGlobalState } from '@vueuse/core'
import dayjs from 'dayjs'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useSerialWorker } from '@/composables/useSerialWorker'

const records = ref([])
const readingRecord = ref(undefined)
const pinBottom = ref(true)
const scrollToRecordIndex = ref(-1)

export const useRecordStore = createGlobalState(() => {
  const worker = useSerialWorker()
  const { bufferToDecFormat, bufferToHexFormat, bufferToString } = useDataCode()

  const rxCount = worker.rxCount
  const txCount = worker.txCount
  const recordCount = worker.recordCount
  const liveRecordPreview = worker.liveRecordPreview

  async function addRecord(record) {
    const data = record.data instanceof Uint8Array
      ? record.data
      : new Uint8Array(record.data || [])
    await worker.appendRecord({
      ...record,
      data,
      time: record.time ? new Date(record.time).getTime() : Date.now(),
      firstSeenAt: record.firstSeenAt ? new Date(record.firstSeenAt).getTime() : undefined,
      lastSeenAt: record.lastSeenAt ? new Date(record.lastSeenAt).getTime() : undefined,
    })
  }

  async function clearRecords() {
    records.value = []
    readingRecord.value = undefined
    await worker.clearRecords(worker.currentSessionId.value)
  }

  async function fetchRecordRows(start, end, sessionId = worker.currentSessionId.value) {
    const { rows } = await worker.fetchRecordRows(sessionId, start, end)
    return rows || []
  }

  async function setRecordDisplay(id, display) {
    const { row } = await worker.setRecordDisplay(id, display)
    return row
  }

  async function getRecordContent(recordOrId) {
    if (!recordOrId)
      return ''
    if (typeof recordOrId === 'string') {
      const { text } = await worker.getRecordContent(recordOrId)
      return text || ''
    }
    if (recordOrId.text)
      return recordOrId.text
    if (recordOrId.data) {
      if (recordOrId.display === 'hex')
        return bufferToHexFormat(recordOrId.data)
      if (recordOrId.display === 'ascii')
        return bufferToString(recordOrId.data)
      return bufferToDecFormat(recordOrId.data)
    }
    if (recordOrId.id) {
      const { text } = await worker.getRecordContent(recordOrId.id)
      return text || ''
    }
    return ''
  }

  async function copyRecordContent(recordOrId) {
    const content = await getRecordContent(recordOrId)
    try {
      await navigator.clipboard.writeText(content)
      toast.success('复制消息内容成功')
    }
    catch (err) {
      console.error('复制失败:', err)
      toast.error('复制消息内容失败')
    }
  }

  function exportListRecords(list) {
    if (!list.length) {
      toast.error('记录为空，导出失败')
      return
    }

    const exportData = list.map((record) => {
      const timestamp = record.timestamp || new Date(record.time).getTime() || null
      const data = record.display === 'hex' ? bufferToHexFormat(record.data) : bufferToString(record.data)
      return {
        type: record.type,
        data,
        timestamp,
        time: timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss:SSS') : null,
        display: record.display,
      }
    })

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    downloadBlob(blob)
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `records-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  async function exportRecords(target = worker.currentSessionId.value) {
    if (Array.isArray(target)) {
      exportListRecords(target)
      return
    }

    const sessionId = typeof target === 'string' ? target : worker.currentSessionId.value
    const { blob } = await worker.exportRecords(sessionId)
    if (!blob || blob.size === 2) {
      toast.error('记录为空，导出失败')
      return
    }
    downloadBlob(blob)
  }

  async function searchRecords(query, sessionId = worker.currentSessionId.value, limit = 50) {
    return worker.searchRecords(sessionId, query, limit)
  }

  async function getRecentWriteRecords(limit = 100, sessionId = worker.currentSessionId.value) {
    return worker.getRecentWriteRecords(sessionId, limit)
  }

  function scrollToRecord(index) {
    scrollToRecordIndex.value = index
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
    recordCount,
    liveRecordPreview,
    addRecord,
    clearRecords,
    fetchRecordRows,
    setRecordDisplay,
    exportRecords,
    copyRecordContent,
    getRecordContent,
    searchRecords,
    getRecentWriteRecords,
    scrollToRecord,
  }
})
