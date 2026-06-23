import { createFileMeta, FILE_RECORD_DISPLAY, fileSummaryText } from '../utils/filePayload.js'

const DB_NAME = 'serial-assistant-records'
const DB_VERSION = 1
const FRAME_IDLE_MS = 5
const STATS_INTERVAL_MS = 100
const TERMINAL_BATCH_BYTES = 32 * 1024
const TERMINAL_INTERVAL_MS = 33

let db = null
let dbAvailable = false
let persistEnabled = true
let currentSessionId = null
let readDisplay = 'hex'
let dataCode = 'UTF-8'
let sessionsCache = []
const recordCounts = new Map()
const memoryRecords = new Map()

let readableStream = null
let writableStream = null
let reader = null
let writer = null
let keepReading = false
let readLoopPromise = null
let writeQueue = Promise.resolve()

let frameChunks = []
let frameBytes = 0
let frameFirstSeenAt = 0
let frameLastSeenAt = 0
let frameTimer = null

let rxCount = 0
let txCount = 0
let recordCount = 0
let liveRecordPreview = null
let statsTimer = null

let terminalActive = false
let terminalAwaitingAck = false
let terminalQueue = []
let terminalQueueBytes = 0
let terminalFlushTimer = null
let lastTerminalSentAt = 0
let terminalCursorIndex = 0
let terminalHasStarted = false
let terminalCatchingUp = false

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function openDatabase() {
  if (typeof indexedDB === 'undefined')
    return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const nextDb = request.result
      if (!nextDb.objectStoreNames.contains('sessions')) {
        nextDb.createObjectStore('sessions', { keyPath: 'id' })
      }
      if (!nextDb.objectStoreNames.contains('records')) {
        const records = nextDb.createObjectStore('records', { keyPath: ['sessionId', 'index'] })
        records.createIndex('bySession', 'sessionId', { unique: false })
        records.createIndex('bySessionType', ['sessionId', 'type'], { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getMemoryRecords(sessionId = currentSessionId) {
  if (!sessionId)
    return []
  if (!memoryRecords.has(sessionId))
    memoryRecords.set(sessionId, [])
  return memoryRecords.get(sessionId)
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

async function loadSessions() {
  if (!dbAvailable) {
    sessionsCache = sortSessions(sessionsCache)
    return sessionsCache
  }
  const tx = db.transaction('sessions', 'readonly')
  const sessions = await requestToPromise(tx.objectStore('sessions').getAll())
  sessionsCache = sortSessions(sessions || [])
  recordCounts.clear()
  sessionsCache.forEach(session => recordCounts.set(session.id, session.recordCount || 0))
  return sessionsCache
}

function emit(type, payload = {}) {
  self.postMessage({ type, payload })
}

function emitSessions() {
  emit('sessionsChanged', {
    sessions: sessionsCache,
    currentSessionId,
    stats: currentStats(),
  })
}

function currentStats() {
  return {
    rxCount,
    txCount,
    recordCount,
    liveRecordPreview,
  }
}

function scheduleStats() {
  if (statsTimer)
    return
  statsTimer = setTimeout(() => {
    statsTimer = null
    emit('stats', {
      stats: currentStats(),
      currentSessionId,
    })
  }, STATS_INTERVAL_MS)
}

function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer)
    return data.slice(0)
  if (ArrayBuffer.isView(data))
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  return new Uint8Array(data || []).buffer
}

function concatChunks(chunks, totalLength) {
  const out = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

function getDecoder() {
  try {
    return dataCode === 'GBK' ? new TextDecoder('gbk') : new TextDecoder()
  }
  catch {
    return new TextDecoder()
  }
}

function bufferToHexFormat(buffer) {
  return Array.from(buffer)
    .map(i => `0x${i.toString(16).padStart(2, '0').toUpperCase()}`)
    .join(', ')
}

function bufferToDecFormat(buffer) {
  return Array.from(buffer).join(' ')
}

function bufferToString(buffer) {
  return getDecoder().decode(buffer)
}

function stringToHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(' ', '&nbsp;')
    .replaceAll('\r\n', '<br/>')
    .replaceAll('\n', '<br/>')
    .replaceAll('\r', '<br/>')
}

function formatRecordText(record) {
  const data = new Uint8Array(record.dataBuffer || record.data || [])
  if (record.display === FILE_RECORD_DISPLAY)
    return fileSummaryText(record.fileMeta, data.byteLength)
  if (record.display === 'ascii')
    return bufferToString(data)
  if (record.display === 'dec')
    return bufferToDecFormat(data)
  return bufferToHexFormat(data)
}

function toRecordRow(record) {
  const isFileRecord = record.display === FILE_RECORD_DISPLAY
  const text = formatRecordText(record)
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
    html: !isFileRecord && record.display === 'ascii' ? stringToHtml(text) : '',
  }
}

function toRecordSummary(record) {
  const row = toRecordRow(record)
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

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const pad = (value, size = 2) => String(value).padStart(size, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}:${pad(date.getMilliseconds(), 3)}`
}

function getSession(sessionId) {
  return sessionsCache.find(session => session.id === sessionId)
}

async function putSession(session) {
  const index = sessionsCache.findIndex(item => item.id === session.id)
  if (index >= 0)
    sessionsCache[index] = session
  else
    sessionsCache.unshift(session)
  sessionsCache = sortSessions(sessionsCache)
  recordCounts.set(session.id, session.recordCount || 0)

  if (dbAvailable && persistEnabled) {
    const tx = db.transaction('sessions', 'readwrite')
    tx.objectStore('sessions').put(session)
    await transactionDone(tx)
  }
}

async function ensureSession(sessionId = currentSessionId) {
  if (sessionId && getSession(sessionId))
    return sessionId

  const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  await putSession({
    id,
    title: formatDate(Date.now()).slice(0, 19),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    recordCount: 0,
    deviceInfo: {
      type: 'unknown',
      port: null,
      name: null,
      details: {},
    },
  })
  currentSessionId = id
  return id
}

async function recomputeCurrentStats(sessionId = currentSessionId) {
  rxCount = 0
  txCount = 0
  recordCount = recordCounts.get(sessionId) || 0

  if (!sessionId)
    return

  if (!dbAvailable || !persistEnabled) {
    for (const record of getMemoryRecords(sessionId)) {
      if (record.type === 'read')
        rxCount += record.byteLength
      else if (record.type === 'write')
        txCount += record.byteLength
    }
    recordCount = getMemoryRecords(sessionId).length
    return
  }

  const tx = db.transaction('records', 'readonly')
  const index = tx.objectStore('records').index('bySession')
  const request = index.openCursor(IDBKeyRange.only(sessionId))
  await new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve()
        return
      }
      const record = cursor.value
      if (record.type === 'read')
        rxCount += record.byteLength
      else if (record.type === 'write')
        txCount += record.byteLength
      cursor.continue()
    }
    request.onerror = () => reject(request.error)
  })
}

async function appendRecord(payload) {
  const sessionId = await ensureSession(payload.sessionId || currentSessionId)
  const index = recordCounts.get(sessionId) || 0
  const dataBuffer = toArrayBuffer(payload.dataBuffer || payload.data)
  const byteLength = dataBuffer.byteLength
  const now = Date.now()
  const fileMeta = payload.display === FILE_RECORD_DISPLAY
    ? createFileMeta(payload.fileMeta, byteLength)
    : undefined
  const record = {
    id: `${sessionId}:${index}`,
    sessionId,
    index,
    type: payload.type,
    display: payload.display || readDisplay,
    time: payload.time || payload.firstSeenAt || now,
    firstSeenAt: payload.firstSeenAt || payload.time || now,
    lastSeenAt: payload.lastSeenAt || payload.time || now,
    timestamp: payload.timestamp || payload.time || now,
    byteLength,
    dataBuffer,
    fileMeta,
  }

  recordCounts.set(sessionId, index + 1)
  if (!dbAvailable || !persistEnabled) {
    getMemoryRecords(sessionId).push(record)
  }
  else {
    const tx = db.transaction(['records', 'sessions'], 'readwrite')
    tx.objectStore('records').put(record)
    const session = getSession(sessionId)
    tx.objectStore('sessions').put({
      ...session,
      updatedAt: now,
      recordCount: index + 1,
    })
    await transactionDone(tx)
  }

  const session = getSession(sessionId)
  if (session) {
    session.updatedAt = now
    session.recordCount = index + 1
    sessionsCache = sortSessions(sessionsCache)
  }

  if (sessionId === currentSessionId) {
    recordCount = index + 1
    if (record.type === 'read')
      rxCount += byteLength
    else if (record.type === 'write')
      txCount += byteLength
  }

  scheduleStats()
  if (record.type === 'read' && terminalActive) {
    enqueueTerminalData(new Uint8Array(dataBuffer.slice(0)))
    terminalCursorIndex = record.index + 1
  }
  return record
}

async function fetchRecordByIndex(sessionId, index) {
  if (!dbAvailable || !persistEnabled)
    return getMemoryRecords(sessionId)[index] || null
  const tx = db.transaction('records', 'readonly')
  return requestToPromise(tx.objectStore('records').get([sessionId, index]))
}

async function fetchRecordRange(sessionId, start, end) {
  if (!sessionId)
    return []
  if (!dbAvailable || !persistEnabled)
    return getMemoryRecords(sessionId).slice(start, end)

  const tx = db.transaction('records', 'readonly')
  const store = tx.objectStore('records')
  const upper = Math.max(start, end - 1)
  if (upper < start)
    return []
  const range = IDBKeyRange.bound([sessionId, start], [sessionId, upper])
  return requestToPromise(store.getAll(range))
}

function parseRecordId(id) {
  const lastColon = id.lastIndexOf(':')
  return {
    sessionId: id.slice(0, lastColon),
    index: Number(id.slice(lastColon + 1)),
  }
}

async function migrateLegacy(legacySnapshot) {
  if (!legacySnapshot || !dbAvailable)
    return false

  const { sessionList = [], sessionRecords = {} } = legacySnapshot
  const tx = db.transaction(['sessions', 'records'], 'readwrite')
  const sessionStore = tx.objectStore('sessions')
  const recordStore = tx.objectStore('records')

  for (const session of sessionList) {
    const records = sessionRecords[`session_${session.id}`] || sessionRecords[session.id] || []
    const nextSession = {
      ...session,
      recordCount: records.length,
      updatedAt: session.updatedAt || Date.now(),
      createdAt: session.createdAt || Date.now(),
    }
    sessionStore.put(nextSession)

    records.forEach((legacyRecord, index) => {
      const data = new Uint8Array(legacyRecord.data || [])
      const time = legacyRecord.time ? new Date(legacyRecord.time).getTime() : (legacyRecord.timestamp || Date.now())
      recordStore.put({
        id: `${session.id}:${index}`,
        sessionId: session.id,
        index,
        type: legacyRecord.type,
        display: legacyRecord.display || 'hex',
        time,
        firstSeenAt: legacyRecord.firstSeenAt || time,
        lastSeenAt: legacyRecord.lastSeenAt || time,
        timestamp: legacyRecord.timestamp || time,
        byteLength: data.byteLength,
        dataBuffer: data.buffer,
      })
    })
  }

  await transactionDone(tx)
  await loadSessions()
  return true
}

async function handleInit(payload) {
  try {
    db = await openDatabase()
    dbAvailable = !!db
    const migrated = await migrateLegacy(payload.legacySnapshot)
    await loadSessions()
    currentSessionId = null
    rxCount = 0
    txCount = 0
    recordCount = 0
    liveRecordPreview = null
    return {
      migrated,
      sessions: sessionsCache,
      currentSessionId,
      stats: currentStats(),
    }
  }
  catch (error) {
    console.warn('IndexedDB 初始化失败，使用内存记录仓库:', error)
    dbAvailable = false
    return {
      migrated: false,
      sessions: sessionsCache,
      currentSessionId,
      stats: currentStats(),
    }
  }
}

async function handleCreateSession(payload) {
  currentSessionId = payload.session.id
  terminalCursorIndex = 0
  terminalHasStarted = false
  await putSession(payload.session)
  rxCount = 0
  txCount = 0
  recordCount = 0
  liveRecordPreview = null
  emitSessions()
  return {
    session: payload.session,
    sessions: sessionsCache,
    currentSessionId,
    stats: currentStats(),
  }
}

async function handleSetCurrentSession(payload) {
  currentSessionId = payload.sessionId
  terminalCursorIndex = 0
  terminalHasStarted = false
  await recomputeCurrentStats(currentSessionId)
  return {
    currentSessionId,
    stats: currentStats(),
  }
}

async function handleUpdateSessionInfo(payload) {
  const session = getSession(payload.sessionId)
  if (!session)
    return { sessions: sessionsCache }
  await putSession({
    ...session,
    ...payload.updates,
  })
  emitSessions()
  return { sessions: sessionsCache }
}

async function handleFetchRecordRows(payload) {
  const sessionId = payload.sessionId || currentSessionId
  const rows = (await fetchRecordRange(sessionId, payload.start, payload.end)).map(toRecordRow)
  return { rows }
}

async function handleSetRecordDisplay(payload) {
  const { sessionId, index } = parseRecordId(payload.id)
  const record = await fetchRecordByIndex(sessionId, index)
  if (!record)
    return { row: null }

  record.display = payload.display
  if (!dbAvailable || !persistEnabled) {
    getMemoryRecords(sessionId)[index] = record
  }
  else {
    const tx = db.transaction('records', 'readwrite')
    tx.objectStore('records').put(record)
    await transactionDone(tx)
  }
  return { row: toRecordRow(record) }
}

async function handleGetRecordContent(payload) {
  const { sessionId, index } = parseRecordId(payload.id)
  const record = await fetchRecordByIndex(sessionId, index)
  return { text: record ? formatRecordText(record) : '' }
}

async function handleGetRecordPayload(payload) {
  const { sessionId, index } = parseRecordId(payload.id)
  const record = await fetchRecordByIndex(sessionId, index)
  if (!record)
    return { record: null }

  const dataBuffer = toArrayBuffer(record.dataBuffer || record.data)
  return {
    record: {
      ...toRecordSummary(record),
      dataBuffer,
    },
  }
}

async function handleSearchRecords(payload) {
  const sessionId = payload.sessionId || currentSessionId
  const query = (payload.query || '').trim().toLowerCase()
  const limit = payload.limit || 50
  const results = []
  let total = 0

  async function visit(record) {
    const dataText = formatRecordText(record)
    const timeText = formatDate(record.time)
    if (!query || dataText.toLowerCase().includes(query) || timeText.toLowerCase().includes(query) || record.type.includes(query)) {
      total += 1
      if (results.length < limit)
        results.push({ ...toRecordRow(record), dataText, timeFormatted: timeText })
    }
  }

  if (!dbAvailable || !persistEnabled) {
    for (const record of getMemoryRecords(sessionId))
      await visit(record)
  }
  else if (sessionId) {
    const tx = db.transaction('records', 'readonly')
    const request = tx.objectStore('records').index('bySession').openCursor(IDBKeyRange.only(sessionId))
    await new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const cursor = request.result
        if (!cursor) {
          resolve()
          return
        }
        await visit(cursor.value)
        cursor.continue()
      }
      request.onerror = () => reject(request.error)
    })
  }

  return { results, total }
}

async function handleGetRecentWriteRecordSummaries(payload) {
  const sessionId = payload.sessionId || currentSessionId
  const limit = payload.limit || 100
  const records = []

  if (!dbAvailable || !persistEnabled) {
    const writes = getMemoryRecords(sessionId).filter(record => record.type === 'write')
    records.push(...writes.slice(-limit))
  }
  else if (sessionId) {
    const tx = db.transaction('records', 'readonly')
    const range = IDBKeyRange.only([sessionId, 'write'])
    const request = tx.objectStore('records').index('bySessionType').openCursor(range, 'prev')
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || records.length >= limit) {
          resolve()
          return
        }
        records.unshift(cursor.value)
        cursor.continue()
      }
      request.onerror = () => reject(request.error)
    })
  }

  return {
    records: records.map(toRecordSummary),
  }
}

async function handleGetRecentWriteRecords(payload) {
  const sessionId = payload.sessionId || currentSessionId
  const limit = payload.limit || 100
  const records = []

  if (!dbAvailable || !persistEnabled) {
    const writes = getMemoryRecords(sessionId).filter(record => record.type === 'write')
    records.push(...writes.slice(-limit))
  }
  else if (sessionId) {
    const tx = db.transaction('records', 'readonly')
    const range = IDBKeyRange.only([sessionId, 'write'])
    const request = tx.objectStore('records').index('bySessionType').openCursor(range, 'prev')
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || records.length >= limit) {
          resolve()
          return
        }
        records.unshift(cursor.value)
        cursor.continue()
      }
      request.onerror = () => reject(request.error)
    })
  }

  return {
    records: records.map(record => ({
      ...record,
      dataBuffer: toArrayBuffer(record.dataBuffer),
    })),
  }
}

async function handleClearRecords(payload) {
  const sessionId = payload.sessionId || currentSessionId
  if (!sessionId)
    return { stats: currentStats(), sessions: sessionsCache }

  if (!dbAvailable || !persistEnabled) {
    memoryRecords.set(sessionId, [])
  }
  else {
    const records = await fetchRecordRange(sessionId, 0, recordCounts.get(sessionId) || 0)
    const tx = db.transaction(['records', 'sessions'], 'readwrite')
    const recordStore = tx.objectStore('records')
    records.forEach(record => recordStore.delete([sessionId, record.index]))
    const session = getSession(sessionId)
    tx.objectStore('sessions').put({
      ...session,
      recordCount: 0,
      updatedAt: Date.now(),
    })
    await transactionDone(tx)
  }

  const session = getSession(sessionId)
  if (session) {
    session.recordCount = 0
    session.updatedAt = Date.now()
  }
  recordCounts.set(sessionId, 0)
  if (sessionId === currentSessionId) {
    rxCount = 0
    txCount = 0
    recordCount = 0
    liveRecordPreview = null
  }
  emitSessions()
  return {
    sessions: sessionsCache,
    stats: currentStats(),
  }
}

async function handleDeleteSession(payload) {
  const sessionId = payload.sessionId
  if (!sessionId)
    return { sessions: sessionsCache, currentSessionId, stats: currentStats() }

  if (!dbAvailable || !persistEnabled) {
    memoryRecords.delete(sessionId)
  }
  else {
    const records = await fetchRecordRange(sessionId, 0, recordCounts.get(sessionId) || 0)
    const tx = db.transaction(['records', 'sessions'], 'readwrite')
    const recordStore = tx.objectStore('records')
    records.forEach(record => recordStore.delete([sessionId, record.index]))
    tx.objectStore('sessions').delete(sessionId)
    await transactionDone(tx)
  }

  sessionsCache = sessionsCache.filter(session => session.id !== sessionId)
  recordCounts.delete(sessionId)
  if (currentSessionId === sessionId)
    currentSessionId = sessionsCache[0]?.id || null
  await recomputeCurrentStats(currentSessionId)
  emitSessions()
  return {
    sessions: sessionsCache,
    currentSessionId,
    stats: currentStats(),
  }
}

async function handleClearAllSessions() {
  if (!dbAvailable || !persistEnabled) {
    memoryRecords.clear()
  }
  else {
    const tx = db.transaction(['records', 'sessions'], 'readwrite')
    tx.objectStore('records').clear()
    tx.objectStore('sessions').clear()
    await transactionDone(tx)
  }
  sessionsCache = []
  recordCounts.clear()
  currentSessionId = null
  rxCount = 0
  txCount = 0
  recordCount = 0
  liveRecordPreview = null
  emitSessions()
  return {
    sessions: sessionsCache,
    currentSessionId,
    stats: currentStats(),
  }
}

async function handleExportRecords(payload) {
  const sessionId = payload.sessionId || currentSessionId
  const total = recordCounts.get(sessionId) || 0
  const exportData = []
  const batchSize = 200
  for (let start = 0; start < total; start += batchSize) {
    const records = await fetchRecordRange(sessionId, start, Math.min(total, start + batchSize))
    exportData.push(...records.map(record => ({
      type: record.type,
      data: formatRecordText(record),
      timestamp: record.time,
      time: formatDate(record.time),
      firstSeenAt: record.firstSeenAt,
      lastSeenAt: record.lastSeenAt,
      display: record.display,
      fileMeta: record.fileMeta || null,
      byteLength: record.byteLength,
    })))
  }
  return {
    blob: new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
  }
}

function updateLivePreview() {
  liveRecordPreview = frameBytes
    ? {
        byteLength: frameBytes,
        time: frameFirstSeenAt,
        display: readDisplay,
      }
    : null
}

async function flushFrame() {
  if (frameTimer) {
    clearTimeout(frameTimer)
    frameTimer = null
  }
  if (!frameBytes)
    return

  const data = concatChunks(frameChunks, frameBytes)
  const firstSeenAt = frameFirstSeenAt
  const lastSeenAt = frameLastSeenAt
  frameChunks = []
  frameBytes = 0
  frameFirstSeenAt = 0
  frameLastSeenAt = 0
  liveRecordPreview = null

  await appendRecord({
    type: 'read',
    dataBuffer: data.buffer,
    time: firstSeenAt,
    firstSeenAt,
    lastSeenAt,
    display: readDisplay,
  })
}

function collectChunk(value) {
  const now = Date.now()
  const data = new Uint8Array(toArrayBuffer(value))
  if (!frameBytes)
    frameFirstSeenAt = now
  frameLastSeenAt = now
  frameBytes += data.byteLength
  frameChunks.push(data)
  updateLivePreview()
  scheduleStats()

  if (frameTimer)
    clearTimeout(frameTimer)
  frameTimer = setTimeout(() => {
    flushFrame().catch(error => console.error('保存串口帧失败:', error))
  }, FRAME_IDLE_MS)
}

async function startReadLoop() {
  keepReading = true
  if (readableStream && keepReading) {
    reader = readableStream.getReader()
  }
  try {
    for (;;) {
      if (!reader || !keepReading)
        break
      const { value, done } = await reader.read()
      if (done)
        break
      if (value?.byteLength)
        collectChunk(value)
    }
  }
  catch (error) {
    if (keepReading)
      console.error('串口读取失败:', error)
  }
  finally {
    try {
      reader?.releaseLock()
    }
    catch {}
    reader = null
  }
  await flushFrame()
}

async function handleAttachSerialStreams(payload) {
  await handleCloseSerialStreams()
  readableStream = payload.readable
  writableStream = payload.writable
  persistEnabled = payload.recordCacheEnabled !== false
  readDisplay = payload.readDisplay || readDisplay
  dataCode = payload.dataCode || dataCode
  if (payload.sessionId)
    currentSessionId = payload.sessionId
  await ensureSession(currentSessionId)
  await recomputeCurrentStats(currentSessionId)
  terminalCursorIndex = recordCounts.get(currentSessionId) || 0
  terminalHasStarted = false
  writeQueue = Promise.resolve()
  writer = writableStream?.getWriter()
  readLoopPromise = startReadLoop()
  return {
    currentSessionId,
    stats: currentStats(),
  }
}

async function handleCloseSerialStreams() {
  keepReading = false
  const activeReader = reader
  const activeWriter = writer
  const activeReadLoop = readLoopPromise

  if (frameTimer) {
    clearTimeout(frameTimer)
    frameTimer = null
  }
  if (terminalFlushTimer) {
    clearTimeout(terminalFlushTimer)
    terminalFlushTimer = null
  }
  try {
    await flushFrame()
  }
  catch (error) {
    console.warn('关闭串口前保存帧失败:', error)
  }
  try {
    await activeReader?.cancel()
  }
  catch {}
  try {
    await activeReadLoop
  }
  catch {}
  try {
    await writeQueue
  }
  catch (error) {
    console.warn('关闭串口前等待发送队列失败:', error)
  }
  writeQueue = Promise.resolve()
  try {
    await activeWriter?.close()
  }
  catch (error) {
    if (activeWriter) {
      console.warn('关闭串口写入流失败，尝试中止:', error)
      try {
        await activeWriter.abort(error)
      }
      catch (abortError) {
        console.warn('中止串口写入流失败:', abortError)
      }
    }
  }
  try {
    activeWriter?.releaseLock()
  }
  catch {}
  try {
    activeReader?.releaseLock()
  }
  catch {}
  reader = null
  writer = null
  readableStream = null
  writableStream = null
  readLoopPromise = null
  terminalQueue = []
  terminalQueueBytes = 0
  terminalAwaitingAck = false
  return { stats: currentStats() }
}

async function handleSendSerial(payload) {
  const data = new Uint8Array(payload.dataBuffer || [])
  const activeWriter = writer
  if (!activeWriter)
    throw new Error('串口未连接，无法发送数据')
  const queuedWrite = writeQueue
    .catch(() => {})
    .then(() => activeWriter.write(data))
  writeQueue = queuedWrite.catch(() => {})
  await queuedWrite
  return { ok: true }
}

function enqueueTerminalData(data) {
  if (!terminalActive)
    return
  terminalQueue.push(data)
  terminalQueueBytes += data.byteLength
  flushTerminalQueue()
}

async function pumpTerminalCatchUp() {
  if (terminalCatchingUp || !terminalActive || !terminalHasStarted || !currentSessionId)
    return

  terminalCatchingUp = true
  try {
    const total = recordCounts.get(currentSessionId) || 0
    for (;;) {
      if (!terminalActive || terminalCursorIndex >= total || terminalQueueBytes >= 512 * 1024)
        break
      const records = await fetchRecordRange(
        currentSessionId,
        terminalCursorIndex,
        Math.min(total, terminalCursorIndex + 100),
      )
      if (!records.length)
        break
      for (const record of records) {
        terminalCursorIndex = record.index + 1
        if (record.type !== 'read')
          continue
        enqueueTerminalData(new Uint8Array(record.dataBuffer.slice(0)))
        if (terminalQueueBytes >= 512 * 1024)
          break
      }
    }
  }
  finally {
    terminalCatchingUp = false
  }
  flushTerminalQueue()
}

function flushTerminalQueue() {
  if (!terminalActive || terminalAwaitingAck || !terminalQueueBytes)
    return

  const elapsed = Date.now() - lastTerminalSentAt
  if (elapsed < TERMINAL_INTERVAL_MS) {
    if (!terminalFlushTimer) {
      terminalFlushTimer = setTimeout(() => {
        terminalFlushTimer = null
        flushTerminalQueue()
      }, TERMINAL_INTERVAL_MS - elapsed)
    }
    return
  }

  const targetLength = Math.min(terminalQueueBytes, TERMINAL_BATCH_BYTES)
  const out = new Uint8Array(targetLength)
  let offset = 0
  while (terminalQueue.length && offset < targetLength) {
    const chunk = terminalQueue[0]
    const take = Math.min(chunk.byteLength, targetLength - offset)
    out.set(chunk.subarray(0, take), offset)
    offset += take
    if (take === chunk.byteLength) {
      terminalQueue.shift()
    }
    else {
      terminalQueue[0] = chunk.subarray(take)
    }
  }
  terminalQueueBytes -= targetLength
  terminalAwaitingAck = true
  lastTerminalSentAt = Date.now()
  self.postMessage({ type: 'terminalData', payload: { dataBuffer: out.buffer } }, [out.buffer])
}

function handleAckTerminalData() {
  terminalAwaitingAck = false
  flushTerminalQueue()
  pumpTerminalCatchUp().catch(error => console.warn('终端补发数据失败:', error))
  return { ok: true }
}

function handleSetTerminalActive(payload) {
  terminalActive = !!payload.active
  if (!terminalActive) {
    terminalAwaitingAck = false
    if (terminalFlushTimer) {
      clearTimeout(terminalFlushTimer)
      terminalFlushTimer = null
    }
  }
  else {
    if (!terminalHasStarted) {
      terminalCursorIndex = recordCounts.get(currentSessionId) || 0
      terminalHasStarted = true
    }
    pumpTerminalCatchUp().catch(error => console.warn('终端补发数据失败:', error))
    flushTerminalQueue()
  }
  return { ok: true }
}

async function dispatch(type, payload) {
  switch (type) {
    case 'init':
      return handleInit(payload)
    case 'createSession':
      return handleCreateSession(payload)
    case 'setCurrentSession':
      return handleSetCurrentSession(payload)
    case 'updateSessionInfo':
      return handleUpdateSessionInfo(payload)
    case 'appendRecord':
      return { record: await appendRecord(payload), stats: currentStats(), sessions: sessionsCache }
    case 'fetchRecordRows':
      return handleFetchRecordRows(payload)
    case 'setRecordDisplay':
      return handleSetRecordDisplay(payload)
    case 'getRecordContent':
      return handleGetRecordContent(payload)
    case 'getRecordPayload':
      return handleGetRecordPayload(payload)
    case 'searchRecords':
      return handleSearchRecords(payload)
    case 'getRecentWriteRecordSummaries':
      return handleGetRecentWriteRecordSummaries(payload)
    case 'getRecentWriteRecords':
      return handleGetRecentWriteRecords(payload)
    case 'clearRecords':
      return handleClearRecords(payload)
    case 'deleteSession':
      return handleDeleteSession(payload)
    case 'clearAllSessions':
      return handleClearAllSessions()
    case 'exportRecords':
      return handleExportRecords(payload)
    case 'updateSettings':
      readDisplay = payload.readDisplay || readDisplay
      dataCode = payload.dataCode || dataCode
      if ('recordCacheEnabled' in payload)
        persistEnabled = payload.recordCacheEnabled !== false
      return { stats: currentStats() }
    case 'attachSerialStreams':
      return handleAttachSerialStreams(payload)
    case 'closeSerialStreams':
      return handleCloseSerialStreams()
    case 'sendSerial':
      return handleSendSerial(payload)
    case 'setTerminalActive':
      return handleSetTerminalActive(payload)
    case 'ackTerminalData':
      return handleAckTerminalData()
    default:
      throw new Error(`未知 Worker 指令: ${type}`)
  }
}

self.addEventListener('message', async (event) => {
  const { id, type, payload = {} } = event.data || {}
  try {
    const result = await dispatch(type, payload)
    self.postMessage({ id, payload: result })
  }
  catch (error) {
    self.postMessage({ id, error: error?.message || String(error) })
  }
})
