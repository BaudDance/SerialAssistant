import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadSettingStore() {
  vi.resetModules()
  const { useSettingStore } = await import('../src/store/useSettingStore.js')
  return useSettingStore()
}

describe('useSettingStore - 终端回车设置', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('默认终端回车模式解析为 CR', async () => {
    const store = await loadSettingStore()

    expect(store.terminalEnterMode.value).toBe('CR')
    expect(store.terminalEnter.value).toBe('\r')
  })

  it('应该将 CR、LF、CRLF 映射为对应的回车字节序列', async () => {
    const store = await loadSettingStore()

    store.terminalEnterMode.value = 'CR'
    expect(store.terminalEnter.value).toBe('\r')

    store.terminalEnterMode.value = 'LF'
    expect(store.terminalEnter.value).toBe('\n')

    store.terminalEnterMode.value = 'CRLF'
    expect(store.terminalEnter.value).toBe('\r\n')
  })

  it('非法终端回车模式应该回退到 CR', async () => {
    localStorage.setItem('Terminal:EnterMode', 'INVALID')
    const store = await loadSettingStore()

    expect(store.terminalEnter.value).toBe('\r')
    expect(store.terminalEnterMode.value).toBe('CR')
  })
})

describe('useSettingStore - 收发字体设置', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该默认使用内置中文等宽字体', async () => {
    const store = await loadSettingStore()

    expect(store.serialDataFontFamily.value).toBe('SerialAssistant Data Mono')
    expect(store.serialDataFontStack.value).toBe('"SerialAssistant Data Mono", monospace')
  })

  it('应该持久化自定义字体并追加系统等宽兜底', async () => {
    localStorage.setItem('SerialData:FontFamily', 'Sarasa Mono SC')
    const store = await loadSettingStore()

    expect(store.serialDataFontFamily.value).toBe('Sarasa Mono SC')
    expect(store.serialDataFontStack.value).toBe('"Sarasa Mono SC", monospace')
  })

  it('空字体名称应该回退到内置字体', async () => {
    localStorage.setItem('SerialData:FontFamily', '')
    const store = await loadSettingStore()

    expect(store.serialDataFontStack.value).toBe('"SerialAssistant Data Mono", monospace')
    expect(store.serialDataFontFamily.value).toBe('SerialAssistant Data Mono')
  })
})
