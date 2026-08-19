export const BUILTIN_SERIAL_DATA_FONT_FAMILY = 'SerialAssistant Data Mono'
export const SYSTEM_SERIAL_DATA_FONT_FAMILY = 'monospace'

export function normalizeSerialDataFontFamily(value) {
  if (typeof value !== 'string')
    return BUILTIN_SERIAL_DATA_FONT_FAMILY

  const withoutControlCharacters = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint <= 31 || codePoint === 127 ? ' ' : character
  }).join('')
  const normalized = withoutControlCharacters
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || BUILTIN_SERIAL_DATA_FONT_FAMILY
}

export function quoteFontFamily(value) {
  const family = normalizeSerialDataFontFamily(value)
  return `"${family.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function createSerialDataFontStack(value) {
  const family = normalizeSerialDataFontFamily(value)
  if (family === SYSTEM_SERIAL_DATA_FONT_FAMILY)
    return SYSTEM_SERIAL_DATA_FONT_FAMILY

  return `${quoteFontFamily(family)}, ${SYSTEM_SERIAL_DATA_FONT_FAMILY}`
}

export function isBuiltinSerialDataFont(value) {
  return normalizeSerialDataFontFamily(value) === BUILTIN_SERIAL_DATA_FONT_FAMILY
}
