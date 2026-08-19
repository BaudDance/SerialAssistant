import { describe, expect, it, vi } from 'vitest'
import { remeasureRecordListAfterFontChange } from '../src/components/RecordPanel/recordListFontLayout'

function createLayout({ stickToBottom, scrollTop }) {
  const scrollElement = { scrollTop }
  const cancelFollowScroll = vi.fn()
  const jumpToBottom = vi.fn()
  const markProgrammaticScroll = vi.fn()
  const measureVisibleElements = vi.fn()
  const virtualizer = {
    measure: vi.fn(),
    scrollToIndex: vi.fn(() => {
      scrollElement.scrollTop = 300
    }),
  }

  return {
    cancelFollowScroll,
    flushLayout: vi.fn(() => Promise.resolve()),
    jumpToBottom,
    markProgrammaticScroll,
    measureVisibleElements,
    scrollElement,
    stickToBottom,
    virtualizer,
    virtualRows: [{ end: 400, index: 3, start: 300 }],
  }
}

describe('recordList 字体切换布局', () => {
  it('自动滚动时应该重新测量并保持贴底', async () => {
    const layout = createLayout({ scrollTop: 420, stickToBottom: true })

    await remeasureRecordListAfterFontChange(layout)

    expect(layout.cancelFollowScroll).toHaveBeenCalledTimes(1)
    expect(layout.virtualizer.measure).toHaveBeenCalledTimes(1)
    expect(layout.measureVisibleElements).toHaveBeenCalledTimes(1)
    expect(layout.jumpToBottom).toHaveBeenCalledTimes(1)
    expect(layout.virtualizer.scrollToIndex).not.toHaveBeenCalled()
  })

  it('用户锁定滚动时应该恢复当前记录内的偏移', async () => {
    const layout = createLayout({ scrollTop: 340, stickToBottom: false })

    await remeasureRecordListAfterFontChange(layout)

    expect(layout.virtualizer.measure).toHaveBeenCalledTimes(1)
    expect(layout.measureVisibleElements).toHaveBeenCalledTimes(1)
    expect(layout.virtualizer.scrollToIndex).toHaveBeenCalledWith(3, {
      align: 'start',
      behavior: 'auto',
    })
    expect(layout.scrollElement.scrollTop).toBe(340)
    expect(layout.jumpToBottom).not.toHaveBeenCalled()
  })
})
