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
