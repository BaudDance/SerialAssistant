import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('serial worker stream cleanup', () => {
  let messageHandler
  let replies
  let requestId

  async function request(type, payload = {}) {
    const id = ++requestId
    messageHandler({ data: { id, type, payload } })

    return new Promise((resolve) => {
      const poll = () => {
        const reply = replies.find(item => item.id === id)
        if (reply) {
          resolve(reply)
          return
        }
        setTimeout(poll, 0)
      }
      poll()
    })
  }

  beforeEach(async () => {
    vi.resetModules()
    messageHandler = null
    replies = []
    requestId = 0

    vi.stubGlobal('self', {
      addEventListener: vi.fn((type, handler) => {
        if (type === 'message')
          messageHandler = handler
      }),
      postMessage: vi.fn((message) => {
        replies.push(message)
      }),
    })
    vi.stubGlobal('indexedDB', undefined)

    await import('../src/workers/serial.worker.js')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('cancels the reader and closes the writer before reporting the serial streams closed', async () => {
    let resolveRead
    const pendingRead = new Promise((resolve) => {
      resolveRead = resolve
    })
    const reader = {
      read: vi.fn(() => pendingRead),
      cancel: vi.fn(() => {
        resolveRead({ done: true })
        return Promise.resolve()
      }),
      releaseLock: vi.fn(),
    }
    const writer = {
      write: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
      abort: vi.fn(() => Promise.resolve()),
      releaseLock: vi.fn(),
    }
    const readable = {
      getReader: vi.fn(() => reader),
    }
    const writable = {
      getWriter: vi.fn(() => writer),
    }

    await request('attachSerialStreams', {
      readable,
      writable,
      recordCacheEnabled: false,
    })
    await request('sendSerial', { dataBuffer: new Uint8Array([0x01]).buffer })
    const closeReply = await request('closeSerialStreams')

    expect(closeReply.error).toBeUndefined()
    expect(readable.getReader).toHaveBeenCalled()
    expect(writable.getWriter).toHaveBeenCalled()
    expect(reader.cancel).toHaveBeenCalled()
    expect(writer.write).toHaveBeenCalled()
    expect(writer.close).toHaveBeenCalled()
    expect(writer.abort).not.toHaveBeenCalled()
    expect(writer.releaseLock).toHaveBeenCalled()
  })
})
