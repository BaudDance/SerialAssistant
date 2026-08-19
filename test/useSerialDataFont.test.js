import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const warning = vi.fn()

vi.mock('vue-sonner', () => ({
  toast: {
    warning,
  },
}))

const originalFontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')

function stubDocumentFonts(load) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      check: vi.fn(() => true),
      load,
    },
  })
}

async function loadFontState() {
  vi.resetModules()
  const [{ useSerialDataFont }, { useSettingStore }, fontUtils] = await Promise.all([
    import('../src/composables/useSerialDataFont/index.js'),
    import('../src/store/useSettingStore.js'),
    import('../src/utils/serialDataFont.js'),
  ])
  return {
    fontState: useSerialDataFont(),
    settingStore: useSettingStore(),
    fontUtils,
  }
}

beforeEach(() => {
  localStorage.clear()
  warning.mockClear()
  document.documentElement.style.removeProperty('--serial-data-font-family')
})

afterEach(() => {
  if (originalFontsDescriptor)
    Object.defineProperty(document, 'fonts', originalFontsDescriptor)
  else
    delete document.fonts
})

describe('useSerialDataFont', () => {
  it('应该等待内置字体加载完成后提交字体和版本号', async () => {
    const load = vi.fn().mockResolvedValue([{}])
    stubDocumentFonts(load)
    const { fontState } = await loadFontState()

    await fontState.ensureSerialDataFontReady()

    expect(load).toHaveBeenCalledTimes(1)
    expect(fontState.activeSerialDataFontStack.value).toBe('"SerialAssistant Data Mono", monospace')
    expect(fontState.serialDataFontLoadState.value).toBe('loaded')
    expect(fontState.serialDataFontVersion.value).toBe(1)
    expect(document.documentElement.style.getPropertyValue('--serial-data-font-family'))
      .toBe('"SerialAssistant Data Mono", monospace')
  })

  it('内置字体失败时应该保留设置并回退到系统字体', async () => {
    stubDocumentFonts(vi.fn().mockRejectedValue(new Error('network failed')))
    const { fontState, settingStore, fontUtils } = await loadFontState()

    await fontState.ensureSerialDataFontReady()

    expect(settingStore.serialDataFontFamily.value).toBe(fontUtils.BUILTIN_SERIAL_DATA_FONT_FAMILY)
    expect(fontState.activeSerialDataFontStack.value).toBe('monospace')
    expect(fontState.serialDataFontLoadState.value).toBe('error')
    expect(warning).toHaveBeenCalledTimes(1)
  })

  it('快速切换时应该忽略过期的内置字体加载结果', async () => {
    let resolveBuiltin
    stubDocumentFonts(vi.fn(() => new Promise((resolve) => {
      resolveBuiltin = resolve
    })))
    const { fontState, settingStore } = await loadFontState()
    const builtinRequest = fontState.ensureSerialDataFontReady()

    settingStore.serialDataFontFamily.value = 'Local Mono'
    await nextTick()
    await fontState.ensureSerialDataFontReady('Local Mono')
    resolveBuiltin([{}])
    await builtinRequest

    expect(fontState.activeSerialDataFontStack.value).toBe('"Local Mono", monospace')
    expect(fontState.serialDataFontLoadState.value).toBe('loaded')
    expect(fontState.serialDataFontVersion.value).toBe(1)
  })
})
