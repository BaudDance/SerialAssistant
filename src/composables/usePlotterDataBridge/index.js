import { usePlotterStore } from '@/store/usePlotterStore'

export function connectPlotterData(serial, plotter = usePlotterStore()) {
  if (!serial?.onPlotterData)
    return () => {}

  return serial.onPlotterData(({ dataBuffer, time, flush }) => {
    plotter.appendChunk(dataBuffer, time, { flush })
  }) || (() => {})
}
