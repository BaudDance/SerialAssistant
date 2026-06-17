import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSerialWorker } from '@/composables/useSerialWorker'

export const useRecordCache = createGlobalState(() => {
  const worker = useSerialWorker()
  const sessionList = worker.sessions
  const currentSessionId = worker.currentSessionId
  const sessionRecords = ref({})
  const cacheSize = computed(() => {
    const session = sessionList.value.find(item => item.id === currentSessionId.value)
    return session?.recordCount || worker.recordCount.value || 0
  })

  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  function formatSessionTitle(timestamp = Date.now()) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  function createDeviceInfo(type, port, name, details = {}) {
    return {
      type,
      port,
      name,
      details,
      timestamp: Date.now(),
    }
  }

  function upsertLocalSession(session) {
    const index = sessionList.value.findIndex(item => item.id === session.id)
    if (index >= 0)
      sessionList.value[index] = session
    else
      sessionList.value.unshift(session)
  }

  function createSession(title, deviceInfo = null) {
    const sessionId = generateSessionId()
    const session = {
      id: sessionId,
      title: title || formatSessionTitle(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recordCount: 0,
      deviceInfo: deviceInfo || {
        type: 'unknown',
        port: null,
        name: null,
        details: {},
      },
    }

    currentSessionId.value = sessionId
    upsertLocalSession(session)
    worker.createSession(session).catch(error => console.error('创建会话失败:', error))
    return sessionId
  }

  function updateSessionInfo(sessionId, updates) {
    const index = sessionList.value.findIndex(session => session.id === sessionId)
    if (index >= 0) {
      sessionList.value[index] = {
        ...sessionList.value[index],
        ...updates,
      }
    }
    return worker.updateSessionInfo(sessionId, updates)
      .catch(error => console.error('更新会话信息失败:', error))
  }

  function updateCurrentSessionDevice(sessionId, deviceInfo) {
    if (!sessionId) {
      console.error('sessionId不能为空')
      return Promise.resolve()
    }
    return updateSessionInfo(sessionId, {
      deviceInfo,
      updatedAt: Date.now(),
    })
  }

  function getSessionsByDevice() {
    const grouped = {
      serial: [],
      bluetooth: [],
      unknown: [],
    }

    sessionList.value.forEach((session) => {
      const deviceType = session.deviceInfo?.type || 'unknown'
      if (grouped[deviceType])
        grouped[deviceType].push(session)
      else
        grouped.unknown.push(session)
    })

    return grouped
  }

  async function deleteSession(sessionId) {
    await worker.deleteSession(sessionId)
  }

  async function clearAllSessions() {
    await worker.clearAllSessions()
  }

  function getSessionStats() {
    const totalRecords = sessionList.value.reduce((sum, session) => sum + (session.recordCount || 0), 0)
    const estimatedSize = totalRecords * 128
    return {
      sessionCount: sessionList.value.length,
      totalRecords,
      totalKeys: sessionList.value.length,
      estimatedSize,
      formattedSize: formatBytes(estimatedSize),
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0)
      return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
  }

  function serializeRecords(records) {
    return records.map(record => ({
      type: record.type,
      data: Array.from(record.data || []),
      time: record.time,
      timestamp: record.timestamp,
      firstSeenAt: record.firstSeenAt,
      lastSeenAt: record.lastSeenAt,
      display: record.display,
    }))
  }

  function deserializeRecords(serializedRecords) {
    if (!Array.isArray(serializedRecords))
      return []

    return serializedRecords.map(record => ({
      ...record,
      data: new Uint8Array(record.data || []),
    }))
  }

  async function loadSessionRecords(sessionId) {
    const session = sessionList.value.find(item => item.id === sessionId)
    const count = session?.recordCount || 0
    const { rows } = await worker.fetchRecordRows(sessionId, 0, count)
    return rows
  }

  async function saveSessionRecords() {}
  async function debouncedSaveSessionRecords() {}
  async function optimizedSaveSessionRecords() {}

  return {
    cacheSize,
    currentSessionId,
    sessionList,
    sessionRecords,
    createSession,
    saveSessionRecords,
    debouncedSaveSessionRecords,
    loadSessionRecords,
    deleteSession,
    clearAllSessions,
    updateSessionInfo,
    updateCurrentSessionDevice,
    getSessionsByDevice,
    createDeviceInfo,
    getSessionStats,
    optimizedSaveSessionRecords,
    serializeRecords,
    deserializeRecords,
    formatBytes,
    generateSessionId,
    formatSessionTitle,
  }
})
