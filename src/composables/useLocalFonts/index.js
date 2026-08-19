import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

function normalizeFontFamilies(fontFaces) {
  const families = new Map()
  for (const face of fontFaces || []) {
    const family = typeof face?.family === 'string' ? face.family.trim() : ''
    if (!family)
      continue

    const key = family.toLocaleLowerCase()
    if (!families.has(key))
      families.set(key, family)
  }

  return Array.from(families.values()).sort((left, right) => left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  }))
}

export const useLocalFonts = createGlobalState(() => {
  const localFontFamilies = ref([])
  const localFontStatus = ref('idle')
  const localFontError = ref(null)
  let requestPromise = null

  function handleRequestError(error) {
    localFontError.value = error
    localFontStatus.value = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
      ? 'denied'
      : 'error'
    return []
  }

  function requestLocalFonts() {
    if (requestPromise)
      return requestPromise

    if (localFontStatus.value !== 'idle')
      return Promise.resolve(localFontFamilies.value)

    if (typeof window === 'undefined' || typeof window.queryLocalFonts !== 'function') {
      localFontStatus.value = 'unsupported'
      return Promise.resolve([])
    }

    localFontStatus.value = 'loading'
    let fontQuery
    try {
      fontQuery = window.queryLocalFonts()
    }
    catch (error) {
      requestPromise = Promise.resolve(handleRequestError(error))
      return requestPromise
    }

    requestPromise = Promise.resolve(fontQuery)
      .then((fontFaces) => {
        localFontFamilies.value = normalizeFontFamilies(fontFaces)
        localFontStatus.value = 'loaded'
        return localFontFamilies.value
      })
      .catch(handleRequestError)

    return requestPromise
  }

  return {
    localFontFamilies,
    localFontStatus,
    localFontError,
    requestLocalFonts,
  }
})

export { normalizeFontFamilies }
