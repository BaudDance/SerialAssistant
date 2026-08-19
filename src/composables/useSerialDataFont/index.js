import { createGlobalState } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useSettingStore } from '@/store/useSettingStore'
import {
  BUILTIN_SERIAL_DATA_FONT_FAMILY,
  createSerialDataFontStack,
  isBuiltinSerialDataFont,
  normalizeSerialDataFontFamily,
  quoteFontFamily,
  SYSTEM_SERIAL_DATA_FONT_FAMILY,
} from '@/utils/serialDataFont'

export const SERIAL_DATA_FONT_CSS_VARIABLE = '--serial-data-font-family'
const FONT_LOAD_SAMPLE = '01234567890123456789中文中文中文中文中文'

function applyRootFontStack(stack) {
  if (typeof document === 'undefined')
    return

  document.documentElement.style.setProperty(SERIAL_DATA_FONT_CSS_VARIABLE, stack)
}

export const useSerialDataFont = createGlobalState(() => {
  const { serialDataFontFamily } = useSettingStore()
  const activeSerialDataFontStack = ref(SYSTEM_SERIAL_DATA_FONT_FAMILY)
  const serialDataFontLoadState = ref('idle')
  const serialDataFontVersion = ref(0)

  let loadGeneration = 0
  let pendingFamily = ''
  let pendingPromise = null
  let resolvedFamily = ''
  let warningShown = false

  applyRootFontStack(activeSerialDataFontStack.value)

  function commitFont(family, stack, state) {
    resolvedFamily = family
    activeSerialDataFontStack.value = stack
    serialDataFontLoadState.value = state
    applyRootFontStack(stack)
    serialDataFontVersion.value += 1
    return stack
  }

  async function loadBuiltinFont() {
    if (typeof document === 'undefined' || !document.fonts?.load)
      return

    const descriptor = `400 20px ${quoteFontFamily(BUILTIN_SERIAL_DATA_FONT_FAMILY)}`
    const faces = await document.fonts.load(descriptor, FONT_LOAD_SAMPLE)
    if (!faces.length && document.fonts.check && !document.fonts.check(descriptor, FONT_LOAD_SAMPLE))
      throw new Error('内置收发字体未注册')
  }

  function ensureSerialDataFontReady(value = serialDataFontFamily.value) {
    const family = normalizeSerialDataFontFamily(value)

    if (family === resolvedFamily && serialDataFontLoadState.value !== 'loading')
      return Promise.resolve(activeSerialDataFontStack.value)

    if (family === pendingFamily && pendingPromise)
      return pendingPromise

    const generation = ++loadGeneration
    pendingFamily = family
    serialDataFontLoadState.value = isBuiltinSerialDataFont(family) ? 'loading' : 'loaded'

    const task = Promise.resolve().then(async () => {
      try {
        if (isBuiltinSerialDataFont(family))
          await loadBuiltinFont()

        if (generation !== loadGeneration)
          return activeSerialDataFontStack.value

        return commitFont(family, createSerialDataFontStack(family), 'loaded')
      }
      catch (error) {
        if (generation !== loadGeneration)
          return activeSerialDataFontStack.value

        console.warn('内置收发字体加载失败，已回退到系统等宽字体:', error)
        if (!warningShown) {
          warningShown = true
          toast.warning('内置收发字体加载失败，已使用系统等宽字体')
        }
        return commitFont(family, SYSTEM_SERIAL_DATA_FONT_FAMILY, 'error')
      }
      finally {
        if (generation === loadGeneration) {
          pendingFamily = ''
          pendingPromise = null
        }
      }
    })

    pendingPromise = task
    return task
  }

  watch(
    serialDataFontFamily,
    family => ensureSerialDataFontReady(family),
    { immediate: true },
  )

  async function waitForFontLayout() {
    await ensureSerialDataFontReady()
    await nextTick()
    return activeSerialDataFontStack.value
  }

  return {
    activeSerialDataFontStack,
    serialDataFontLoadState,
    serialDataFontVersion,
    ensureSerialDataFontReady,
    waitForFontLayout,
  }
})
