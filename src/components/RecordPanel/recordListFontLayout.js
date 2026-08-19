export function captureRecordListFontAnchor(virtualRows, scrollTop) {
  const anchorRow = virtualRows.find(row => row.end >= scrollTop) || virtualRows[0]
  if (!anchorRow)
    return null

  return {
    index: anchorRow.index,
    offset: Math.max(0, scrollTop - anchorRow.start),
  }
}

export async function remeasureRecordListAfterFontChange({
  cancelFollowScroll,
  flushLayout,
  jumpToBottom,
  markProgrammaticScroll,
  measureVisibleElements,
  scrollElement,
  stickToBottom,
  virtualizer,
  virtualRows,
}) {
  if (!scrollElement)
    return

  const anchor = captureRecordListFontAnchor(virtualRows, scrollElement.scrollTop)

  cancelFollowScroll()
  markProgrammaticScroll()
  virtualizer.measure()
  await flushLayout()
  measureVisibleElements()
  await flushLayout()

  if (stickToBottom) {
    jumpToBottom()
    return
  }

  if (!anchor)
    return

  virtualizer.scrollToIndex(anchor.index, { align: 'start', behavior: 'auto' })
  await flushLayout()
  markProgrammaticScroll()
  scrollElement.scrollTop = Math.max(0, scrollElement.scrollTop + anchor.offset)
}
