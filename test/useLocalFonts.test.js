import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadLocalFonts() {
  vi.resetModules()
  const { useLocalFonts } = await import('../src/composables/useLocalFonts/index.js')
  return useLocalFonts()
}

afterEach(() => {
  delete window.queryLocalFonts
})

describe('useLocalFonts', () => {
  it('不支持 Local Font Access API 时应该提供兜底状态', async () => {
    const localFonts = await loadLocalFonts()

    await expect(localFonts.requestLocalFonts()).resolves.toEqual([])
    expect(localFonts.localFontStatus.value).toBe('unsupported')
  })

  it('应该按字体族去重排序，并且每个会话只查询一次', async () => {
    window.queryLocalFonts = vi.fn().mockResolvedValue([
      { family: 'Beta Mono', style: 'Regular' },
      { family: 'alpha Mono', style: 'Bold' },
      { family: 'Alpha Mono', style: 'Regular' },
      { family: '' },
    ])
    const localFonts = await loadLocalFonts()

    const firstRequest = localFonts.requestLocalFonts()
    const secondRequest = localFonts.requestLocalFonts()

    expect(firstRequest).toBe(secondRequest)
    await expect(firstRequest).resolves.toEqual(['alpha Mono', 'Beta Mono'])
    expect(window.queryLocalFonts).toHaveBeenCalledTimes(1)
    expect(localFonts.localFontStatus.value).toBe('loaded')
  })

  it.each(['NotAllowedError', 'SecurityError'])('应该将 %s 识别为未授权', async (name) => {
    window.queryLocalFonts = vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { name }))
    const localFonts = await loadLocalFonts()

    await expect(localFonts.requestLocalFonts()).resolves.toEqual([])
    expect(localFonts.localFontStatus.value).toBe('denied')
  })

  it('应该处理同步抛出的查询错误', async () => {
    window.queryLocalFonts = vi.fn(() => {
      throw new Error('query failed')
    })
    const localFonts = await loadLocalFonts()

    await expect(localFonts.requestLocalFonts()).resolves.toEqual([])
    expect(localFonts.localFontStatus.value).toBe('error')
    expect(window.queryLocalFonts).toHaveBeenCalledTimes(1)
  })
})
