import { describe, expect, it, vi } from 'vitest'

describe('xterm 字体加载期间的数据连续性', () => {
  it('在 open 之前写入的数据应该保留在终端缓冲区', async () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null)
    const { Terminal } = await import('@xterm/xterm')
    getContext.mockRestore()
    const terminal = new Terminal()

    await new Promise(resolve => terminal.write('before-font-ready', resolve))

    expect(terminal.buffer.active.getLine(0).translateToString(true)).toBe('before-font-ready')
    terminal.dispose()
  })
})
