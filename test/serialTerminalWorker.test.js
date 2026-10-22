import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('serial worker terminal delivery', () => {
  let messages
  let request

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    messages = []
    let messageHandler
    let requestId = 0
    vi.stubGlobal('indexedDB', undefined)
    vi.stubGlobal('self', {
      addEventListener(type, handler) {
        if (type === 'message')
          messageHandler = handler
      },
      postMessage(message) {
        messages.push(message)
      },
    })
    await import('../src/workers/serial.worker.js')
    request = async (type, payload = {}) => {
      const id = ++requestId
      await messageHandler({ data: { id, type, payload } })
      const response = messages.find(message => message.id === id)
      if (response.error)
        throw new Error(response.error)
      return response.payload
    }
    await request('init')
    await request('createSession', {
      session: {
        id: 'terminal_session',
        title: 'Terminal',
        createdAt: 1,
        updatedAt: 1,
        recordCount: 0,
      },
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function terminalMessages() {
    return messages.filter(message => message.type === 'terminalData')
  }

  async function appendRead(text) {
    await request('appendRecord', {
      type: 'read',
      display: 'ascii',
      dataBuffer: new TextEncoder().encode(text).buffer,
    })
    await vi.advanceTimersByTimeAsync(40)
  }

  it('resumes from the existing cursor after a mode switch and reconnect', async () => {
    await request('setTerminalActive', { active: true })
    await appendRead('before')
    const first = terminalMessages()[0]
    expect(new TextDecoder().decode(first.payload.dataBuffer)).toBe('before')
    await request('ackTerminalData', { batchId: first.payload.batchId })

    await request('setTerminalActive', { active: false })
    await appendRead('hidden')
    await request('setTerminalActive', { active: true })
    await vi.advanceTimersByTimeAsync(40)
    const second = terminalMessages()[1]
    expect(new TextDecoder().decode(second.payload.dataBuffer)).toBe('hidden')
    await request('ackTerminalData', { batchId: second.payload.batchId })

    await request('closeSerialStreams')
    await appendRead('reconnect')
    await request('attachSerialStreams', { sessionId: 'terminal_session' })
    await request('setTerminalActive', { active: true })
    await vi.advanceTimersByTimeAsync(40)
    const third = terminalMessages()[2]
    expect(new TextDecoder().decode(third.payload.dataBuffer)).toBe('reconnect')
    expect(terminalMessages()).toHaveLength(3)
  })

  it('drops pre-clear batches without deleting records or replaying them', async () => {
    await request('setTerminalActive', { active: true })
    await appendRead('sent-before-clear')
    const oldBatch = terminalMessages()[0]
    await appendRead('queued-before-clear')

    const { generation } = await request('clearTerminalOutput')
    expect(generation).toBe(1)
    await request('ackTerminalData', { batchId: oldBatch.payload.batchId })
    await request('setTerminalActive', { active: true })
    await vi.advanceTimersByTimeAsync(40)
    expect(terminalMessages()).toHaveLength(1)

    await appendRead('after-clear')
    const fresh = terminalMessages()[1]
    expect(fresh.payload.generation).toBe(generation)
    expect(new TextDecoder().decode(fresh.payload.dataBuffer)).toBe('after-clear')
    const { rows } = await request('fetchRecordRows', { sessionId: 'terminal_session', start: 0, end: 3 })
    expect(rows.map(row => row.text)).toEqual(['sent-before-clear', 'queued-before-clear', 'after-clear'])
  })

  it('cuts off a partially collected serial frame while new bytes keep arriving', async () => {
    let controller
    const readable = new ReadableStream({
      start(nextController) {
        controller = nextController
      },
    })
    await request('attachSerialStreams', { sessionId: 'terminal_session', readable, readDisplay: 'ascii' })
    await request('setTerminalActive', { active: true })

    controller.enqueue(new TextEncoder().encode('before-clear'))
    await Promise.resolve()
    const { generation } = await request('clearTerminalOutput')
    await request('setTerminalActive', { active: true })
    await vi.advanceTimersByTimeAsync(40)
    expect(terminalMessages()).toHaveLength(0)

    controller.enqueue(new TextEncoder().encode('after-clear'))
    await vi.advanceTimersByTimeAsync(50)
    const fresh = terminalMessages()[0]
    expect(fresh.payload.generation).toBe(generation)
    expect(new TextDecoder().decode(fresh.payload.dataBuffer)).toBe('after-clear')
    const { rows } = await request('fetchRecordRows', { sessionId: 'terminal_session', start: 0, end: 2 })
    expect(rows.map(row => row.text)).toEqual(['before-clear', 'after-clear'])

    controller.close()
    await request('closeSerialStreams')
  })

  it('waits for a pre-clear record that has not finished saving', async () => {
    await request('setTerminalActive', { active: true })
    const pendingRecord = request('appendRecord', {
      type: 'read',
      display: 'ascii',
      dataBuffer: new TextEncoder().encode('old-record').buffer,
    })
    const clear = request('clearTerminalOutput')
    const [, { generation }] = await Promise.all([pendingRecord, clear])
    await request('setTerminalActive', { active: true })
    await vi.advanceTimersByTimeAsync(40)
    expect(terminalMessages()).toHaveLength(0)

    await appendRead('fresh-record')
    const fresh = terminalMessages()[0]
    expect(fresh.payload.generation).toBe(generation)
    expect(new TextDecoder().decode(fresh.payload.dataBuffer)).toBe('fresh-record')
  })
})
