import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('serial worker record access facade', () => {
  let worker

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('Worker', undefined)
    const module = await import('../src/composables/useSerialWorker/index.js')
    worker = module.useSerialWorker()
    await worker.ready()
    await worker.clearAllSessions()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('stores records and fetches only the requested range', async () => {
    await worker.createSession({
      id: 'session_test',
      title: 'Test Session',
      createdAt: 1000,
      updatedAt: 1000,
      recordCount: 0,
      deviceInfo: { type: 'serial', port: 'USB-1', name: 'Test Serial', details: {} },
    })

    await worker.appendRecord({
      type: 'read',
      display: 'hex',
      time: 1000,
      firstSeenAt: 1000,
      lastSeenAt: 1005,
      data: new Uint8Array([0x01, 0x02]),
    })
    await worker.appendRecord({
      type: 'write',
      display: 'ascii',
      time: 1010,
      data: new TextEncoder().encode('OK'),
    })

    const { rows } = await worker.fetchRecordRows('session_test', 0, 1)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'session_test:0',
      index: 0,
      type: 'read',
      byteLength: 2,
      text: '0x01, 0x02',
      firstSeenAt: 1000,
      lastSeenAt: 1005,
    })
    expect(worker.recordCount.value).toBe(2)
    expect(worker.rxCount.value).toBe(2)
    expect(worker.txCount.value).toBe(2)
  })

  it('searches and changes display without exposing raw data in rows', async () => {
    await worker.createSession({
      id: 'session_search',
      title: 'Search Session',
      createdAt: 1000,
      updatedAt: 1000,
      recordCount: 0,
      deviceInfo: { type: 'serial', port: 'USB-2', name: 'Search Serial', details: {} },
    })
    await worker.appendRecord({
      type: 'read',
      display: 'ascii',
      time: 1000,
      data: new TextEncoder().encode('hello worker'),
    })

    const result = await worker.searchRecords('session_search', 'worker')
    expect(result.total).toBe(1)
    expect(result.results[0].dataBuffer).toBeUndefined()
    expect(result.results[0].dataText).toBe('hello worker')

    const { row } = await worker.setRecordDisplay('session_search:0', 'hex')
    expect(row.text).toBe('0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x77, 0x6F, 0x72, 0x6B, 0x65, 0x72')
  })

  it('stores file records as summaries and fetches raw payload on demand', async () => {
    await worker.createSession({
      id: 'session_file',
      title: 'File Session',
      createdAt: 1000,
      updatedAt: 1000,
      recordCount: 0,
      deviceInfo: { type: 'serial', port: 'USB-3', name: 'File Serial', details: {} },
    })
    await worker.appendRecord({
      type: 'write',
      display: 'file',
      time: 1000,
      data: new Uint8Array([0x42, 0x4D, 0x01]),
      fileMeta: {
        name: 'screen.bmp',
        size: 3,
        type: 'image/bmp',
        lastModified: 123,
      },
    })

    const { rows } = await worker.fetchRecordRows('session_file', 0, 1)

    expect(rows[0]).toMatchObject({
      id: 'session_file:0',
      display: 'file',
      byteLength: 3,
      text: 'screen.bmp (3 B)',
      fileMeta: {
        name: 'screen.bmp',
        size: 3,
        type: 'image/bmp',
        lastModified: 123,
      },
    })
    expect(rows[0].dataBuffer).toBeUndefined()

    const summaries = await worker.getRecentWriteRecordSummaries('session_file', 10)
    expect(summaries[0].dataBuffer).toBeUndefined()
    expect(summaries[0].text).toBe('screen.bmp (3 B)')

    const payload = await worker.getRecordPayload('session_file:0')
    expect(Array.from(payload.data)).toEqual([0x42, 0x4D, 0x01])
    expect(payload.fileMeta.name).toBe('screen.bmp')
  })
})

describe('serial worker migration marker fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps using the worker when localStorage cannot write the migration marker', async () => {
    vi.resetModules()

    const values = new Map([
      ['session:list', JSON.stringify([{ id: 'legacy_session', title: 'Legacy Session' }])],
      ['session:records', JSON.stringify({})],
    ])

    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
    const localStorageMock = {
      getItem: vi.fn(key => values.get(key) ?? null),
      removeItem: vi.fn((key) => {
        values.delete(key)
      }),
      setItem: vi.fn((key, value) => {
        if (key === 'session:indexeddb:migrated')
          throw quotaError
        values.set(key, value)
      }),
    }

    class FakeWorker {
      static instance = null

      constructor() {
        this.listeners = new Map()
        this.messages = []
        FakeWorker.instance = this
      }

      addEventListener(type, handler) {
        if (!this.listeners.has(type))
          this.listeners.set(type, [])
        this.listeners.get(type).push(handler)
      }

      postMessage(message) {
        this.messages.push(message)
        const payload = {
          migrated: message.type === 'init',
          sessions: [],
          currentSessionId: null,
          stats: {
            rxCount: 0,
            txCount: 0,
            recordCount: 0,
            liveRecordPreview: null,
          },
        }
        queueMicrotask(() => {
          for (const handler of this.listeners.get('message') || [])
            handler({ data: { id: message.id, payload } })
        })
      }
    }

    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('Worker', FakeWorker)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const module = await import('../src/composables/useSerialWorker/index.js')
    const worker = module.useSerialWorker()

    await worker.ready()
    await worker.clearAllSessions()

    expect(localStorageMock.setItem).toHaveBeenCalledWith('session:indexeddb:migrated', expect.any(String))
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('session:list')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('session:records')
    expect(FakeWorker.instance.messages.map(message => message.type)).toEqual(['init', 'clearAllSessions'])
    expect(errorSpy).not.toHaveBeenCalledWith('初始化串口 Worker 失败:', expect.anything())
  })
})

describe('serial worker plotter event facade', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('dispatches plotter data events and supports unsubscribe', async () => {
    vi.resetModules()

    class FakeWorker {
      static instance = null

      constructor() {
        this.listeners = new Map()
        this.messages = []
        FakeWorker.instance = this
      }

      addEventListener(type, handler) {
        if (!this.listeners.has(type))
          this.listeners.set(type, [])
        this.listeners.get(type).push(handler)
      }

      postMessage(message) {
        this.messages.push(message)
        queueMicrotask(() => {
          this.emit('message', {
            data: {
              id: message.id,
              payload: {
                sessions: [],
                currentSessionId: null,
                stats: {
                  rxCount: 0,
                  txCount: 0,
                  recordCount: 0,
                  liveRecordPreview: null,
                },
              },
            },
          })
        })
      }

      emit(type, event) {
        for (const handler of this.listeners.get(type) || [])
          handler(event)
      }
    }

    vi.stubGlobal('Worker', FakeWorker)
    const module = await import('../src/composables/useSerialWorker/index.js')
    const worker = module.useSerialWorker()
    await worker.ready()

    const received = []
    const unsubscribe = worker.onPlotterData(payload => received.push(payload))
    const firstBuffer = new Uint8Array([1, 2, 3]).buffer

    FakeWorker.instance.emit('message', {
      data: {
        type: 'plotterData',
        payload: {
          dataBuffer: firstBuffer,
          time: 123,
        },
      },
    })

    unsubscribe()
    FakeWorker.instance.emit('message', {
      data: {
        type: 'plotterData',
        payload: {
          dataBuffer: new Uint8Array([4]).buffer,
          time: 124,
        },
      },
    })

    expect(received).toHaveLength(1)
    expect(new Uint8Array(received[0].dataBuffer)).toEqual(new Uint8Array([1, 2, 3]))
    expect(received[0].time).toBe(123)
  })
})
