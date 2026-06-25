<script setup>
import { Clock, Pause, Play, RotateCcw, Timer, Trash2 } from 'lucide-vue-next'
import UPlot from 'uplot'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PLOTTER_MAX_POINT_OPTIONS, usePlotterStore } from '@/store/usePlotterStore'
import 'uplot/dist/uPlot.min.css'

defineOptions({
  name: 'PlotterPanel',
})

const plotter = usePlotterStore()
const { paused, autoScroll, maxPoints, timeMode, series, pointMeta, pointCount, chartData } = plotter
const chartEl = ref(null)
const tooltip = ref(null)
const dragging = ref(false)
const maxPointsModel = computed({
  get: () => String(maxPoints.value),
  set: value => maxPoints.value = Number(value),
})
const seriesSignature = computed(() => series.value.map(item => `${item.name}:${item.visible}`).join('|'))
const timeModeTitle = computed(() => timeMode.value === 'absolute' ? '切换到相对时间' : '切换到实际时间')
const xAxisLabel = computed(() => timeMode.value === 'absolute' ? 'Received Time' : 'Elapsed')
const MIN_ZOOM_SPAN_SECONDS = 0.001

let chart = null
let resizeObserver = null
let pendingUpdate = false
let dragState = null

function getCssColor(name) {
  if (typeof window === 'undefined')
    return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function chartColors() {
  return [
    getCssColor('--chart-1'),
    getCssColor('--chart-2'),
    getCssColor('--chart-3'),
    getCssColor('--chart-4'),
    getCssColor('--chart-5'),
  ]
}

function chartSize() {
  const rect = chartEl.value?.getBoundingClientRect()
  return {
    width: Math.max(100, Math.floor(rect?.width || 100)),
    height: Math.max(100, Math.floor(rect?.height || 100)),
  }
}

function formatClockTime(value) {
  const date = new Date(value * 1000)
  return formatDateTime(date)
}

function formatDateTime(date) {
  const pad = number => String(number).padStart(2, '0')
  const padMilliseconds = number => String(number).padStart(3, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${padMilliseconds(date.getMilliseconds())}`
}

function buildOptions() {
  const colors = chartColors()
  const muted = getCssColor('--muted-foreground')
  const border = getCssColor('--border')
  return {
    ...chartSize(),
    legend: {
      show: false,
    },
    cursor: {
      drag: {
        x: false,
        y: false,
      },
    },
    scales: {
      x: {
        time: timeMode.value === 'absolute',
      },
    },
    axes: [
      {
        label: xAxisLabel.value,
        values: timeMode.value === 'absolute'
          ? (_plot, values) => values.map(formatClockTime)
          : (_plot, values) => values.map(value => `${Number(value).toFixed(2).replace(/\.?0+$/, '')}s`),
        stroke: muted,
        grid: { stroke: border },
        ticks: { stroke: border },
      },
      {
        stroke: muted,
        grid: { stroke: border },
        ticks: { stroke: border },
      },
    ],
    series: [
      {},
      ...series.value.map((item, index) => ({
        label: item.name,
        stroke: colors[index % colors.length],
        width: 2,
        show: item.visible,
        spanGaps: false,
      })),
    ],
  }
}

function destroyChart() {
  chart?.destroy()
  chart = null
}

function createChart() {
  if (!chartEl.value)
    return
  destroyChart()
  chart = new UPlot(buildOptions(), chartData.value, chartEl.value)
}

function syncSeriesVisibility() {
  if (!chart)
    return
  series.value.forEach((item, index) => {
    chart.setSeries(index + 1, { show: item.visible }, false)
  })
}

function updateChart() {
  if (!chart) {
    createChart()
    return
  }

  if (chart.series.length !== series.value.length + 1) {
    createChart()
    return
  }

  chart.setData(chartData.value, autoScroll.value)
  syncSeriesVisibility()
}

function scheduleChartUpdate() {
  if (pendingUpdate)
    return
  pendingUpdate = true
  requestAnimationFrame(() => {
    pendingUpdate = false
    updateChart()
  })
}

function resizeChart() {
  if (!chart) {
    createChart()
    return
  }
  chart.setSize(chartSize())
}

function togglePaused() {
  paused.value = !paused.value
}

function clearPlotter() {
  plotter.clear()
  scheduleChartUpdate()
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value)
    scheduleChartUpdate()
}

function toggleTimeMode() {
  timeMode.value = timeMode.value === 'absolute' ? 'relative' : 'absolute'
}

function isInsidePlot(event) {
  if (!chart)
    return false
  const rect = chart.rect
  return event.clientX >= rect.left
    && event.clientX <= rect.left + rect.width
    && event.clientY >= rect.top
    && event.clientY <= rect.top + rect.height
}

function onChartClick(event) {
  if (dragState?.hasDragged)
    return

  const rect = chartEl.value?.getBoundingClientRect()
  if (!rect)
    return

  const y = event.clientY - rect.top
  if (y >= rect.height - 36)
    toggleTimeMode()
}

function clampRange(min, max) {
  const xData = chartData.value[0]
  const dataMin = xData[0]
  const dataMax = xData[xData.length - 1]
  const dataSpan = dataMax - dataMin
  const rangeSpan = max - min
  if (!Number.isFinite(dataSpan) || dataSpan <= 0 || rangeSpan >= dataSpan) {
    return { min: dataMin, max: dataMax }
  }

  if (min < dataMin) {
    return {
      min: dataMin,
      max: dataMin + rangeSpan,
    }
  }
  if (max > dataMax) {
    return {
      min: dataMax - rangeSpan,
      max: dataMax,
    }
  }
  return { min, max }
}

function onChartWheel(event) {
  if (!chart || pointCount.value < 2)
    return

  const plotRect = chart.rect
  const mouseLeft = Math.min(Math.max(event.clientX - plotRect.left, 0), plotRect.width)
  const center = chart.posToVal(mouseLeft, 'x')
  const scale = chart.scales.x
  const currentMin = Number(scale.min)
  const currentMax = Number(scale.max)
  if (!Number.isFinite(center) || !Number.isFinite(currentMin) || !Number.isFinite(currentMax))
    return

  event.preventDefault()
  autoScroll.value = false

  const zoomFactor = event.deltaY < 0 ? 0.8 : 1.25
  const leftSpan = Math.max(center - currentMin, MIN_ZOOM_SPAN_SECONDS)
  const rightSpan = Math.max(currentMax - center, MIN_ZOOM_SPAN_SECONDS)
  let nextMin = center - leftSpan * zoomFactor
  let nextMax = center + rightSpan * zoomFactor

  const xData = chartData.value[0]
  const dataMin = xData[0]
  const dataMax = xData[xData.length - 1]
  const dataSpan = dataMax - dataMin
  if (event.deltaY > 0 && Number.isFinite(dataSpan) && dataSpan > 0) {
    if (nextMin < dataMin)
      nextMin = dataMin
    if (nextMax > dataMax)
      nextMax = dataMax
  }

  if (nextMax - nextMin < MIN_ZOOM_SPAN_SECONDS)
    return

  chart.setScale('x', { min: nextMin, max: nextMax })
}

function onChartMouseDown(event) {
  if (event.button !== 0 || !chart || pointCount.value < 2 || !isInsidePlot(event))
    return

  const scale = chart.scales.x
  const min = Number(scale.min)
  const max = Number(scale.max)
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return

  event.preventDefault()
  autoScroll.value = false
  dragState = {
    startX: event.clientX,
    min,
    max,
    width: chart.rect.width,
    hasDragged: false,
  }
  dragging.value = true
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onWindowMouseMove(event) {
  if (!chart || !dragState)
    return

  const dx = event.clientX - dragState.startX
  if (Math.abs(dx) > 2)
    dragState.hasDragged = true

  const span = dragState.max - dragState.min
  const shift = -dx * span / Math.max(dragState.width, 1)
  const range = clampRange(dragState.min + shift, dragState.max + shift)
  chart.setScale('x', range)
}

function onWindowMouseUp() {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  dragging.value = false
  setTimeout(() => {
    dragState = null
  }, 0)
}

function onChartMouseMove(event) {
  if (!chart || !isInsidePlot(event)) {
    tooltip.value = null
    return
  }

  const rect = chartEl.value?.getBoundingClientRect()
  const plotRect = chart.rect
  const mouseLeft = event.clientX - plotRect.left
  const mouseTop = event.clientY - plotRect.top
  const index = chart.posToIdx(mouseLeft)
  const xData = chartData.value[0]
  if (index < 0 || index >= xData.length) {
    tooltip.value = null
    return
  }

  const pointLeft = chart.valToPos(xData[index], 'x')
  if (Math.abs(pointLeft - mouseLeft) > 12) {
    tooltip.value = null
    return
  }

  const values = []
  let nearPoint = false
  series.value.forEach((item) => {
    const value = item.values[index]
    if (value == null)
      return
    values.push({ name: item.name, value })
    if (!item.visible)
      return
    const pointTop = chart.valToPos(value, 'y')
    if (Math.abs(pointTop - mouseTop) <= 18)
      nearPoint = true
  })

  if (!nearPoint || !values.length) {
    tooltip.value = null
    return
  }

  const meta = pointMeta.value[index]
  tooltip.value = {
    left: event.clientX - rect.left + 12,
    top: event.clientY - rect.top + 12,
    receivedAt: meta?.receivedAt ? formatDateTime(new Date(meta.receivedAt)) : '',
    rawData: meta?.rawData || '',
    values,
  }
}

function onChartMouseLeave() {
  tooltip.value = null
}

function toggleSeries(name) {
  plotter.toggleSeries(name)
  scheduleChartUpdate()
}

watch([pointCount, seriesSignature, autoScroll], scheduleChartUpdate)

watch(timeMode, () => {
  createChart()
})

onMounted(() => {
  nextTick(() => {
    createChart()
    resizeObserver = new ResizeObserver(resizeChart)
    if (chartEl.value)
      resizeObserver.observe(chartEl.value)
  })
})

onBeforeUnmount(() => {
  onWindowMouseUp()
  resizeObserver?.disconnect()
  destroyChart()
})
</script>

<template>
  <div class="h-full w-full flex flex-col bg-background">
    <div class="h-11 shrink-0 border-b px-3 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        class="size-8 cursor-pointer"
        :title="paused ? '继续绘图' : '暂停绘图'"
        @click="togglePaused"
      >
        <Play v-if="paused" class="size-4" />
        <Pause v-else class="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="size-8 cursor-pointer"
        title="清空"
        @click="clearPlotter"
      >
        <Trash2 class="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="size-8 cursor-pointer"
        :class="{ 'bg-accent text-accent-foreground': autoScroll }"
        title="自动滚动"
        @click="toggleAutoScroll"
      >
        <RotateCcw class="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="size-8 cursor-pointer"
        :title="timeModeTitle"
        @click="toggleTimeMode"
      >
        <Clock v-if="timeMode === 'absolute'" class="size-4" />
        <Timer v-else class="size-4" />
      </Button>

      <Select v-model="maxPointsModel">
        <SelectTrigger class="h-8 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in PLOTTER_MAX_POINT_OPTIONS"
            :key="option"
            :value="String(option)"
          >
            {{ option }}
          </SelectItem>
        </SelectContent>
      </Select>

      <div class="ml-auto text-xs text-muted-foreground tabular-nums">
        {{ pointCount }} pts
      </div>
    </div>

    <div class="relative flex-1 min-h-0">
      <div
        ref="chartEl"
        class="absolute inset-0 plotter-chart"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        :title="timeModeTitle"
        @click="onChartClick"
        @mousedown="onChartMouseDown"
        @mousemove="onChartMouseMove"
        @mouseleave="onChartMouseLeave"
        @wheel="onChartWheel"
      />
      <div
        v-if="tooltip"
        class="absolute z-10 max-w-70 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md pointer-events-none"
        :style="{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }"
      >
        <div class="font-medium">
          {{ tooltip.receivedAt }}
        </div>
        <div class="mt-1 text-muted-foreground break-all">
          {{ tooltip.rawData }}
        </div>
        <div class="mt-2 grid gap-1">
          <div
            v-for="item in tooltip.values"
            :key="item.name"
            class="flex items-center justify-between gap-3 tabular-nums"
          >
            <span>{{ item.name }}</span>
            <span>{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div
        v-if="!pointCount"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-base text-muted-foreground pointer-events-none"
      >
        <div class="text-lg text-foreground">
          等待数字数据...
        </div>
        <div class="text-sm leading-6 text-center">
          每段串口数据识别为一组，格式可以是：
        </div>
        <div class="grid gap-1.5 text-sm font-mono text-left">
          <div>一个数： 12.3</div>
          <div>逗号分隔：1,2,3</div>
          <div>空格分隔：1 2 3</div>
          <div>键值对：temp:24 hum:63</div>
          <div>键值对：temp=24,hum=63</div>
        </div>
      </div>
    </div>

    <div
      v-if="series.length"
      class="shrink-0 border-t px-3 py-2 flex flex-wrap items-center gap-2"
    >
      <button
        v-for="(item, index) in series"
        :key="item.name"
        type="button"
        class="h-7 px-2 rounded-md border text-xs cursor-pointer flex items-center gap-1.5"
        :class="item.visible ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground opacity-70'"
        @click="toggleSeries(item.name)"
      >
        <span
          class="size-2 rounded-full"
          :style="{ backgroundColor: item.visible ? `var(--chart-${(index % 5) + 1})` : 'var(--muted-foreground)' }"
        />
        <span>{{ item.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.plotter-chart :deep(.uplot) {
  width: 100%;
  height: 100%;
  color: var(--foreground);
  background: var(--background);
}

.plotter-chart :deep(.u-wrap) {
  width: 100%;
  height: 100%;
}

.plotter-chart :deep(.u-over),
.plotter-chart :deep(.u-under) {
  border-radius: var(--radius-sm);
}
</style>
