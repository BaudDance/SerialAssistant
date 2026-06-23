import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'
import { createFileMeta, FILE_RECORD_DISPLAY, fileSummaryText } from '@/utils/filePayload'

const MIGRATION_KEY = 'session:indexeddb:migrated'
const LEGACY_SESSION_LIST_KEY = 'session:list'
const LEGACY_SESSION_RECORDS_KEY = 'session:records'

function getLocalStorage() {
  try {
    return globalThis.localStorage || null
  }
  catch (error) {
    console.warn('访问本地会话缓存失败:', error)
    return null
  }
}

function writeStorageItem(storage, key, value) {
  try {
    storage.setItem(key, value)
    return true
  }
  catch (error) {
    console.warn(`写入本地会话缓存失败(${key}):`, error)
    return false
  }
}

function removeStorageItem(storage, key) {
  try {
    storage.removeItem(key)
    return true
  }
  catch (error) {
    console.warn(`删除本地会话缓存失败(${key}):`, error)
    return false
  }
}

function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer)
    return data.slice(0)
  if (ArrayBuffer.isView(data))
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  return new Uint8Array(data || []).buffer
}

function normalizeRecord(record) {
  return {
    ...record,
    data: record.data instanceof Uint8Array
      ? record.data
      : new Uint8Array(record.dataBuffer || record.data || []),
  }
}

function readLegacySnapshot() {
  const storage = getLocalStorage()
  if (!storage)
    return null

  try {
    if (storage.getItem(MIGRATION_KEY))
      return null

    const sessionList = JSON.parse(storage.getItem(LEGACY_SESSION_LIST_KEY) || '[]')
    const sessionRecords = JSON.parse(storage.getItem(LEGACY_SESSION_RECORDS_KEY) || '{}')
    if (!Array.isArray(sessionList) || (!sessionList.length && !Object.keys(sessionRecords).length)) {
      writeStorageItem(storage, MIGRATION_KEY, 'empty')
      return null
    }
    return { sessionList, sessionRecords }
  }
  catch (error) {
    console.warn('读取旧会话缓存失败:', error)
    return null
  }
}

function createLocalBackend() {
  const sessions = []
  const recordsBySession = new Map()
  let currentSessionId = null
  let stats = {
    rxCount: 0,
    txCount: 0,
    recordCount: 0,
    liveRecordPreview: null,
  }

  function getRecords(sessionId = currentSessionId) {
    if (!sessionId)
      return []
    if (!recordsBySession.has(sessionId))
      recordsBySession.set(sessionId, [])
    return recordsBySession.get(sessionId)
  }

  function renderText(record) {
    const data = new Uint8Array(record.dataBuffer || record.data || [])
    if (record.display === FILE_RECORD_DISPLAY)
      return fileSummaryText(record.fileMeta, data.byteLength)
    if (record.display === 'ascii')
      return new TextDecoder().decode(data)
    if (record.display === 'dec')
      return Array.from(data).join(' ')
    return Array.from(data).map(i => `0x${i.toString(16).padStart(2, '0').toUpperCase()}`).join(', ')
  }

  function htmlEscape(str) {
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll(' ', '&nbsp;')
      .replaceAll('\r\n', '<br/>')
      .replaceAll('\n', '<br/>')
      .replaceAll('\r', '<br/>')
  }

  function toRow(record) {
    const text = renderText(record)
    return {
      id: record.id,
      index: record.index,
      type: record.type,
      display: record.display,
      fileMeta: record.fileMeta || null,
      time: record.time,
      firstSeenAt: record.firstSeenAt,
      lastSeenAt: record.lastSeenAt,
      byteLength: record.byteLength,
      text,
      html: record.display === 'ascii' ? htmlEscape(text) : '',
    }
  }

  function toSummary(record) {
    const row = toRow(record)
    return {
      id: row.id,
      index: row.index,
      type: row.type,
      display: row.display,
      fileMeta: row.fileMeta,
      time: row.time,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
      byteLength: row.byteLength,
      text: row.text,
    }
  }

  function parseRecordId(id) {
    const lastColon = id.lastIndexOf(':')
    return {
      sessionId: id.slice(0, lastColon),
      index: Number(id.slice(lastColon + 1)),
    }
  }

  async function handle(type, payload = {}) {
    if (type === 'init') {
      return { sessions, currentSessionId, stats }
    }
    if (type === 'createSession') {
      sessions.unshift(payload.session)
      currentSessionId = payload.session.id
      recordsBySession.set(currentSessionId, [])
      return { session: payload.session, sessions, currentSessionId, stats }
    }
    if (type === 'setCurrentSession') {
      currentSessionId = payload.sessionId
      const records = getRecords()
      stats = {
        rxCount: records.filter(r => r.type === 'read').reduce((sum, r) => sum + r.byteLength, 0),
        txCount: records.filter(r => r.type === 'write').reduce((sum, r) => sum + r.byteLength, 0),
        recordCount: records.length,
        liveRecordPreview: null,
      }
      return { currentSessionId, stats }
    }
    if (type === 'updateSessionInfo') {
      const index = sessions.findIndex(item => item.id === payload.sessionId)
      if (index >= 0)
        sessions[index] = { ...sessions[index], ...payload.updates }
      return { sessions }
    }
    if (type === 'appendRecord') {
      if (!currentSessionId && !payload.sessionId) {
        const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        sessions.unshift({
          id,
          title: new Date().toLocaleString(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          recordCount: 0,
          deviceInfo: { type: 'unknown', port: null, name: null, details: {} },
        })
        currentSessionId = id
      }
      const sessionId = payload.sessionId || currentSessionId
      const list = getRecords(sessionId)
      const data = new Uint8Array(payload.dataBuffer || [])
      const record = {
        id: `${sessionId}:${list.length}`,
        sessionId,
        index: list.length,
        type: payload.type,
        display: payload.display || 'hex',
        time: payload.time || Date.now(),
        firstSeenAt: payload.firstSeenAt || payload.time || Date.now(),
        lastSeenAt: payload.lastSeenAt || payload.time || Date.now(),
        byteLength: data.byteLength,
        dataBuffer: data.buffer,
        fileMeta: payload.display === FILE_RECORD_DISPLAY
          ? createFileMeta(payload.fileMeta, data.byteLength)
          : undefined,
      }
      list.push(record)
      const session = sessions.find(item => item.id === sessionId)
      if (session) {
        session.recordCount = list.length
        session.updatedAt = Date.now()
      }
      stats = {
        rxCount: stats.rxCount + (record.type === 'read' ? record.byteLength : 0),
        txCount: stats.txCount + (record.type === 'write' ? record.byteLength : 0),
        recordCount: list.length,
        liveRecordPreview: null,
      }
      return { record, stats, sessions }
    }
    if (type === 'fetchRecordRows') {
      return {
        rows: getRecords(payload.sessionId).slice(payload.start, payload.end).map(toRow),
      }
    }
    if (type === 'getRecordContent') {
      const { sessionId, index } = parseRecordId(payload.id)
      const record = getRecords(sessionId)[index]
      return { text: record ? renderText(record) : '' }
    }
    if (type === 'getRecordPayload') {
      const { sessionId, index } = parseRecordId(payload.id)
      const record = getRecords(sessionId)[index]
      return {
        record: record
          ? {
              ...toSummary(record),
              dataBuffer: toArrayBuffer(record.dataBuffer),
            }
          : null,
      }
    }
    if (type === 'setRecordDisplay') {
      const { sessionId, index } = parseRecordId(payload.id)
      const record = getRecords(sessionId)[index]
      if (record)
        record.display = payload.display
      return { row: record ? toRow(record) : null }
    }
    if (type === 'searchRecords') {
      const query = (payload.query || '').trim().toLowerCase()
      const results = []
      let total = 0
      for (const record of getRecords(payload.sessionId)) {
        const text = renderText(record)
        if (!query || text.toLowerCase().includes(query) || record.type.includes(query)) {
          total += 1
          if (results.length < (payload.limit || 50))
            results.push({ ...toRow(record), dataText: text })
        }
      }
      return { results, total }
    }
    if (type === 'getRecentWriteRecords') {
      return {
        records: getRecords(payload.sessionId)
          .filter(record => record.type === 'write')
          .slice(-(payload.limit || 100))
          .map(record => ({ ...record, dataBuffer: toArrayBuffer(record.dataBuffer) })),
      }
    }
    if (type === 'getRecentWriteRecordSummaries') {
      return {
        records: getRecords(payload.sessionId)
          .filter(record => record.type === 'write')
          .slice(-(payload.limit || 100))
          .map(toSummary),
      }
    }
    if (type === 'clearRecords') {
      const list = getRecords(payload.sessionId)
      list.length = 0
      stats = { rxCount: 0, txCount: 0, recordCount: 0, liveRecordPreview: null }
      return { stats, sessions }
    }
    if (type === 'deleteSession') {
      const index = sessions.findIndex(item => item.id === payload.sessionId)
      if (index >= 0)
        sessions.splice(index, 1)
      recordsBySession.delete(payload.sessionId)
      if (currentSessionId === payload.sessionId)
        currentSessionId = sessions[0]?.id || null
      return { sessions, currentSessionId, stats }
    }
    if (type === 'clearAllSessions') {
      sessions.length = 0
      recordsBySession.clear()
      currentSessionId = null
      stats = { rxCount: 0, txCount: 0, recordCount: 0, liveRecordPreview: null }
      return { sessions, currentSessionId, stats }
    }
    if (type === 'exportRecords') {
      const exportData = getRecords(payload.sessionId).map(record => ({
        type: record.type,
        data: renderText(record),
        timestamp: record.time,
        time: new Date(record.time).toISOString(),
        display: record.display,
      }))
      return {
        blob: new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
      }
    }
    return {}
  }

  return { handle }
}

export const useSerialWorker = createGlobalState(() => {
  const sessions = ref([])
  const currentSessionId = ref(null)
  const rxCount = ref(0)
  const txCount = ref(0)
  const recordCount = ref(0)
  const liveRecordPreview = ref(null)

  const terminalHandlers = new Set()
  const localBackend = createLocalBackend()
  const pending = new Map()
  let worker = null
  let requestId = 0
  let readyPromise = null
  let useLocal = typeof Worker === 'undefined'

  function applyStats(nextStats = {}) {
    rxCount.value = nextStats.rxCount || 0
    txCount.value = nextStats.txCount || 0
    recordCount.value = nextStats.recordCount || 0
    liveRecordPreview.value = nextStats.liveRecordPreview || null
  }

  function applyPayload(payload = {}) {
    if (payload.sessions)
      sessions.value = payload.sessions
    if ('currentSessionId' in payload)
      currentSessionId.value = payload.currentSessionId
    if (payload.stats)
      applyStats(payload.stats)
  }

  function markMigrationDone(result) {
    if (!result?.migrated)
      return
    const storage = getLocalStorage()
    if (!storage)
      return

    removeStorageItem(storage, LEGACY_SESSION_LIST_KEY)
    removeStorageItem(storage, LEGACY_SESSION_RECORDS_KEY)
    writeStorageItem(storage, MIGRATION_KEY, String(Date.now()))
  }

  function ensureWorker() {
    if (useLocal || worker)
      return
    try {
      worker = new Worker(new URL('../../workers/serial.worker.js', import.meta.url), { type: 'module' })
      worker.addEventListener('message', (event) => {
        const { id, type, payload, error } = event.data || {}
        if (id && pending.has(id)) {
          const { resolve, reject } = pending.get(id)
          pending.delete(id)
          if (error) {
            reject(new Error(error))
          }
          else {
            applyPayload(payload)
            resolve(payload)
          }
          return
        }

        if (type === 'stats' || type === 'sessionsChanged') {
          applyPayload(payload)
        }
        else if (type === 'terminalData') {
          for (const handler of terminalHandlers)
            handler(payload)
        }
      })
      worker.addEventListener('error', (event) => {
        console.error('串口 Worker 错误:', event)
      })
    }
    catch (error) {
      console.warn('创建串口 Worker 失败，将使用内存后端:', error)
      useLocal = true
    }
  }

  async function post(type, payload = {}, transfer = []) {
    if (useLocal) {
      const result = await localBackend.handle(type, payload)
      applyPayload(result)
      return result
    }

    ensureWorker()
    return new Promise((resolve, reject) => {
      const id = ++requestId
      pending.set(id, { resolve, reject })
      try {
        worker.postMessage({ id, type, payload }, transfer)
      }
      catch (error) {
        pending.delete(id)
        reject(error)
      }
    })
  }

  async function request(type, payload = {}, transfer = []) {
    if (type !== 'init')
      await readyPromise
    return post(type, payload, transfer)
  }

  function init() {
    if (readyPromise)
      return readyPromise
    ensureWorker()
    const legacySnapshot = readLegacySnapshot()
    readyPromise = post('init', { legacySnapshot })
      .then((result) => {
        markMigrationDone(result)
        return result
      })
      .catch((error) => {
        console.error('初始化串口 Worker 失败:', error)
        useLocal = true
        return localBackend.handle('init')
      })
    return readyPromise
  }

  init()

  return {
    sessions,
    currentSessionId,
    rxCount,
    txCount,
    recordCount,
    liveRecordPreview,
    ready: () => readyPromise,
    request,
    createSession: session => request('createSession', { session }),
    setCurrentSession: sessionId => request('setCurrentSession', { sessionId }),
    updateSessionInfo: (sessionId, updates) => request('updateSessionInfo', { sessionId, updates }),
    deleteSession: sessionId => request('deleteSession', { sessionId }),
    clearAllSessions: () => request('clearAllSessions'),
    clearRecords: sessionId => request('clearRecords', { sessionId }),
    updateSettings: settings => request('updateSettings', settings),
    attachSerialStreams: (payload, transfer) => request('attachSerialStreams', payload, transfer),
    closeSerialStreams: () => request('closeSerialStreams'),
    sendSerial: (data) => {
      const buffer = toArrayBuffer(data)
      return request('sendSerial', { dataBuffer: buffer }, [buffer])
    },
    appendRecord: (record) => {
      const buffer = toArrayBuffer(record.data || record.dataBuffer)
      return request('appendRecord', { ...record, data: undefined, dataBuffer: buffer }, [buffer])
    },
    fetchRecordRows: (sessionId, start, end) => request('fetchRecordRows', { sessionId, start, end }),
    setRecordDisplay: (id, display) => request('setRecordDisplay', { id, display }),
    getRecordContent: id => request('getRecordContent', { id }),
    getRecordPayload: async (id) => {
      const result = await request('getRecordPayload', { id })
      return result.record ? normalizeRecord(result.record) : null
    },
    searchRecords: (sessionId, query, limit = 50) => request('searchRecords', { sessionId, query, limit }),
    exportRecords: sessionId => request('exportRecords', { sessionId }),
    getRecentWriteRecordSummaries: async (sessionId, limit = 100) => {
      const result = await request('getRecentWriteRecordSummaries', { sessionId, limit })
      return result.records || []
    },
    getRecentWriteRecords: async (sessionId, limit = 100) => {
      const result = await request('getRecentWriteRecords', { sessionId, limit })
      return (result.records || []).map(normalizeRecord)
    },
    setTerminalActive: active => request('setTerminalActive', { active }),
    ackTerminalData: () => request('ackTerminalData'),
    onTerminalData(handler) {
      terminalHandlers.add(handler)
      return () => terminalHandlers.delete(handler)
    },
  }
})
