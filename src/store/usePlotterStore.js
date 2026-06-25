import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { parsePlotterLine } from '@/utils/plotterParser'

export const PLOTTER_MAX_POINT_OPTIONS = [1000, 5000, 10000]
export const DEFAULT_PLOTTER_MAX_POINTS = 5000
export const PLOTTER_PARTIAL_LINE_IDLE_MS = 120
export const PLOTTER_TIME_MODES = ['relative', 'absolute']
export const DEFAULT_PLOTTER_TIME_MODE = 'absolute'

function normalizeMaxPoints(value) {
  const nextValue = Number(value)
  return PLOTTER_MAX_POINT_OPTIONS.includes(nextValue)
    ? nextValue
    : DEFAULT_PLOTTER_MAX_POINTS
}

function normalizeTimeMode(value) {
  return PLOTTER_TIME_MODES.includes(value) ? value : DEFAULT_PLOTTER_TIME_MODE
}

function toUint8Array(data) {
  if (data instanceof Uint8Array)
    return data
  if (data instanceof ArrayBuffer)
    return new Uint8Array(data)
  if (ArrayBuffer.isView(data))
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return new Uint8Array(data || [])
}

export const usePlotterStore = createGlobalState(() => {
  const paused = ref(false)
  const autoScroll = ref(true)
  const maxPoints = useLocalStorage('plotter:maxPoints', DEFAULT_PLOTTER_MAX_POINTS, {
    listenToStorageChanges: false,
  })
  const timeMode = ref(DEFAULT_PLOTTER_TIME_MODE)
  const sampleTimes = ref([])
  const pointMeta = ref([])
  const series = ref([])
  const lineBuffer = ref('')
  let lastSampleTime = -Infinity
  let pendingLineTime = 0
  let decoder = new TextDecoder()
  let partialLineTimer = null

  timeMode.value = normalizeTimeMode(timeMode.value)

  const xValues = computed(() => {
    if (timeMode.value === 'absolute')
      return sampleTimes.value.map(timestamp => timestamp / 1000)

    const origin = sampleTimes.value[0] || 0
    return sampleTimes.value.map(timestamp => (timestamp - origin) / 1000)
  })
  const pointCount = computed(() => sampleTimes.value.length)
  const chartData = computed(() => [
    xValues.value,
    ...series.value.map(item => item.values),
  ])

  function trimToMaxPoints() {
    const limit = normalizeMaxPoints(maxPoints.value)
    const extra = sampleTimes.value.length - limit
    if (extra <= 0)
      return

    sampleTimes.value.splice(0, extra)
    pointMeta.value.splice(0, extra)
    series.value.forEach(item => item.values.splice(0, extra))
  }

  function ensureSeries(name) {
    let item = series.value.find(seriesItem => seriesItem.name === name)
    if (item)
      return item

    item = {
      name,
      values: Array.from({ length: sampleTimes.value.length }, () => null),
      visible: true,
    }
    series.value.push(item)
    return item
  }

  function normalizeTimestamp(time) {
    const timestamp = Number(time)
    return Number.isFinite(timestamp) ? timestamp : Date.now()
  }

  function nextSampleTime(time) {
    const timestamp = normalizeTimestamp(time)
    if (timestamp <= lastSampleTime)
      lastSampleTime += 1
    else
      lastSampleTime = timestamp
    return lastSampleTime
  }

  function appendSamples(samples, time, rawData = '') {
    if (!samples.length)
      return

    const receivedAt = normalizeTimestamp(time)
    sampleTimes.value.push(nextSampleTime(receivedAt))
    pointMeta.value.push({
      receivedAt,
      rawData: String(rawData || '').trim(),
    })
    series.value.forEach(item => item.values.push(null))
    const pointIndex = sampleTimes.value.length - 1

    samples.forEach((sample, index) => {
      const name = sample.name || `CH${index + 1}`
      const item = ensureSeries(name)
      item.values[pointIndex] = sample.value
    })

    trimToMaxPoints()
  }

  function appendLine(line, time = Date.now()) {
    appendSamples(parsePlotterLine(line), time, line)
  }

  function clearPartialLineTimer() {
    if (!partialLineTimer)
      return
    clearTimeout(partialLineTimer)
    partialLineTimer = null
  }

  function flushPendingLine() {
    clearPartialLineTimer()
    const line = lineBuffer.value
    lineBuffer.value = ''
    appendLine(line, pendingLineTime || Date.now())
  }

  function schedulePendingLineFlush() {
    clearPartialLineTimer()
    if (!lineBuffer.value.trim())
      return
    partialLineTimer = setTimeout(flushPendingLine, PLOTTER_PARTIAL_LINE_IDLE_MS)
  }

  function appendChunk(dataBuffer, time = Date.now(), options = {}) {
    if (paused.value)
      return

    clearPartialLineTimer()
    const timestamp = normalizeTimestamp(time)
    const text = decoder.decode(toUint8Array(dataBuffer), { stream: true })
    if (!text)
      return

    const lines = `${lineBuffer.value}${text}`.split(/\r\n|\n|\r/)
    lineBuffer.value = lines.pop() || ''
    pendingLineTime = timestamp
    lines.forEach(line => appendLine(line, timestamp))
    if (options.flush) {
      flushPendingLine()
      return
    }
    schedulePendingLineFlush()
  }

  function clear() {
    clearPartialLineTimer()
    sampleTimes.value = []
    pointMeta.value = []
    series.value = []
    lineBuffer.value = ''
    lastSampleTime = -Infinity
    pendingLineTime = 0
    decoder = new TextDecoder()
  }

  function setSeriesVisible(name, visible) {
    const item = series.value.find(seriesItem => seriesItem.name === name)
    if (item)
      item.visible = visible
  }

  function toggleSeries(name) {
    const item = series.value.find(seriesItem => seriesItem.name === name)
    if (item)
      item.visible = !item.visible
  }

  watch(maxPoints, (value) => {
    const normalized = normalizeMaxPoints(value)
    if (normalized !== value) {
      maxPoints.value = normalized
      return
    }
    trimToMaxPoints()
  }, { immediate: true })

  watch(timeMode, (value) => {
    const normalized = normalizeTimeMode(value)
    if (normalized !== value)
      timeMode.value = normalized
  }, { immediate: true })

  return {
    paused,
    autoScroll,
    maxPoints,
    timeMode,
    series,
    pointMeta,
    pointCount,
    chartData,
    appendChunk,
    clear,
    setSeriesVisible,
    toggleSeries,
  }
})
