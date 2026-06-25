import { beforeEach, describe, expect, it, vi } from 'vitest'

function encode(text) {
  return new TextEncoder().encode(text)
}

describe('parsePlotterLine', () => {
  it('parses single and multiple numeric samples', async () => {
    const { parsePlotterLine } = await import('../src/utils/plotterParser.js')

    expect(parsePlotterLine('12.3')).toEqual([{ value: 12.3 }])
    expect(parsePlotterLine('1,2,3')).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
    expect(parsePlotterLine('1 2 3')).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
    expect(parsePlotterLine('1, 2 3')).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
  })

  it('parses named values', async () => {
    const { parsePlotterLine } = await import('../src/utils/plotterParser.js')

    expect(parsePlotterLine('temp:24.5 hum:63')).toEqual([
      { name: 'temp', value: 24.5 },
      { name: 'hum', value: 63 },
    ])
    expect(parsePlotterLine('temp=24.5,hum=63')).toEqual([
      { name: 'temp', value: 24.5 },
      { name: 'hum', value: 63 },
    ])
  })

  it('parses signed decimals and scientific notation', async () => {
    const { parsePlotterLine } = await import('../src/utils/plotterParser.js')

    expect(parsePlotterLine('-1.5 +2 .25 3e-2')).toEqual([
      { value: -1.5 },
      { value: 2 },
      { value: 0.25 },
      { value: 0.03 },
    ])
  })

  it('ignores lines without numeric values', async () => {
    const { parsePlotterLine } = await import('../src/utils/plotterParser.js')

    expect(parsePlotterLine('hello world')).toEqual([])
    expect(parsePlotterLine('')).toEqual([])
  })
})

describe('usePlotterStore', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  async function loadStore() {
    const { usePlotterStore } = await import('../src/store/usePlotterStore.js')
    const store = usePlotterStore()
    store.clear()
    return store
  }

  it('joins partial lines across chunks', async () => {
    const store = await loadStore()

    store.appendChunk(encode('12.'))
    expect(store.pointCount.value).toBe(0)

    store.appendChunk(encode('5\n'))
    expect(store.pointCount.value).toBe(1)
    expect(store.series.value[0].name).toBe('CH1')
    expect(store.series.value[0].values).toEqual([12.5])
  })

  it('plots a numeric chunk without a trailing newline after idle', async () => {
    vi.useFakeTimers()
    const store = await loadStore()
    const { PLOTTER_PARTIAL_LINE_IDLE_MS } = await import('../src/store/usePlotterStore.js')

    store.appendChunk(encode('1,2,3'))
    expect(store.pointCount.value).toBe(0)

    vi.advanceTimersByTime(PLOTTER_PARTIAL_LINE_IDLE_MS)
    expect(store.pointCount.value).toBe(1)
    expect(store.series.value.map(item => item.name)).toEqual(['CH1', 'CH2', 'CH3'])
    expect(store.series.value.map(item => item.values[0])).toEqual([1, 2, 3])
    vi.useRealTimers()
  })

  it('plots a no-newline frame immediately when flushed', async () => {
    const store = await loadStore()

    store.appendChunk(encode('1,2,3'), Date.now(), { flush: true })

    expect(store.pointCount.value).toBe(1)
    expect(store.series.value.map(item => item.name)).toEqual(['CH1', 'CH2', 'CH3'])
    expect(store.series.value.map(item => item.values[0])).toEqual([1, 2, 3])
  })

  it('uses relative receive time for x values', async () => {
    const store = await loadStore()
    store.timeMode.value = 'relative'

    store.appendChunk(encode('1\n'), 1000)
    store.appendChunk(encode('2\n'), 1250)

    expect(store.chartData.value[0]).toEqual([0, 0.25])
  })

  it('can switch x values between relative and absolute receive time', async () => {
    const store = await loadStore()

    store.appendChunk(encode('1\n'), 1000)
    store.appendChunk(encode('2\n'), 1250)

    expect(store.chartData.value[0]).toEqual([1, 1.25])

    store.timeMode.value = 'relative'
    expect(store.chartData.value[0]).toEqual([0, 0.25])

    store.timeMode.value = 'absolute'
    expect(store.chartData.value[0]).toEqual([1, 1.25])
  })

  it('keeps point metadata for tooltip display', async () => {
    const store = await loadStore()

    store.appendChunk(encode('temp:24 hum:63\n'), 1000)

    expect(store.pointMeta.value).toEqual([
      {
        receivedAt: 1000,
        rawData: 'temp:24 hum:63',
      },
    ])
  })

  it('keeps x values monotonic when multiple lines share a timestamp', async () => {
    const store = await loadStore()
    store.timeMode.value = 'relative'

    store.appendChunk(encode('1\n2\n'), 1000)

    expect(store.chartData.value[0]).toEqual([0, 0.001])
  })

  it('keeps channel names stable for unnamed and named samples', async () => {
    const store = await loadStore()

    store.appendChunk(encode('1,2\n3,4\n'))
    expect(store.series.value.map(item => item.name)).toEqual(['CH1', 'CH2'])
    expect(store.series.value[0].values).toEqual([1, 3])
    expect(store.series.value[1].values).toEqual([2, 4])

    store.clear()
    store.appendChunk(encode('temp:24 hum:63\ntemp:25 hum:64\n'))
    expect(store.series.value.map(item => item.name)).toEqual(['temp', 'hum'])
    expect(store.series.value[0].values).toEqual([24, 25])
    expect(store.series.value[1].values).toEqual([63, 64])
  })

  it('drops incoming samples while paused', async () => {
    const store = await loadStore()

    store.paused.value = true
    store.appendChunk(encode('1\n'))
    store.paused.value = false
    store.appendChunk(encode('2\n'))

    expect(store.pointCount.value).toBe(1)
    expect(store.series.value[0].values).toEqual([2])
  })

  it('clears data and partial line cache', async () => {
    const store = await loadStore()

    store.appendChunk(encode('12'))
    store.clear()
    store.appendChunk(encode('.5\n'))

    expect(store.pointCount.value).toBe(1)
    expect(store.series.value[0].values).toEqual([0.5])
  })

  it('keeps only the latest maxPoints samples', async () => {
    const store = await loadStore()
    store.maxPoints.value = 1000

    for (let index = 0; index < 1001; index += 1)
      store.appendChunk(encode(`${index}\n`))

    expect(store.pointCount.value).toBe(1000)
    expect(store.series.value[0].values[0]).toBe(1)
    expect(store.series.value[0].values.at(-1)).toBe(1000)
  })
})
