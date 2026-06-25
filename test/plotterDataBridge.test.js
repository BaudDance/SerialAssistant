import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('connectPlotterData', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('forwards serial plotter data into the plotter store', async () => {
    const { connectPlotterData } = await import('../src/composables/usePlotterDataBridge/index.js')
    const unsubscribe = vi.fn()
    const handlers = []
    const serial = {
      onPlotterData: vi.fn((handler) => {
        handlers.push(handler)
        return unsubscribe
      }),
    }
    const plotter = {
      appendChunk: vi.fn(),
    }
    const dataBuffer = new Uint8Array([49, 10]).buffer

    const cleanup = connectPlotterData(serial, plotter)
    handlers[0]({ dataBuffer, time: 1234, flush: true })

    expect(serial.onPlotterData).toHaveBeenCalledTimes(1)
    expect(plotter.appendChunk).toHaveBeenCalledWith(dataBuffer, 1234, { flush: true })

    cleanup()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('is safe when serial plotter events are unavailable', async () => {
    const { connectPlotterData } = await import('../src/composables/usePlotterDataBridge/index.js')
    const plotter = {
      appendChunk: vi.fn(),
    }

    const cleanup = connectPlotterData({}, plotter)
    cleanup()

    expect(plotter.appendChunk).not.toHaveBeenCalled()
  })

  it('caches parsed points before the plotter panel is shown', async () => {
    const { connectPlotterData } = await import('../src/composables/usePlotterDataBridge/index.js')
    const { usePlotterStore } = await import('../src/store/usePlotterStore.js')
    const store = usePlotterStore()
    let handler = null
    const serial = {
      onPlotterData: vi.fn((nextHandler) => {
        handler = nextHandler
        return vi.fn()
      }),
    }

    const cleanup = connectPlotterData(serial)
    handler({
      dataBuffer: new TextEncoder().encode('1,2\n').buffer,
      time: 1000,
      flush: true,
    })

    expect(store.pointCount.value).toBe(1)
    expect(store.series.value.map(item => item.name)).toEqual(['CH1', 'CH2'])
    expect(store.series.value.map(item => item.values[0])).toEqual([1, 2])

    cleanup()
  })
})
