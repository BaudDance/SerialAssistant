import { describe, expect, it } from 'vitest'
import {
  BUILTIN_SERIAL_DATA_FONT_FAMILY,
  createSerialDataFontStack,
  normalizeSerialDataFontFamily,
  quoteFontFamily,
} from '../src/utils/serialDataFont'

describe('serialDataFont 字体名称处理', () => {
  it('空值和非字符串应该回退到内置字体', () => {
    expect(normalizeSerialDataFontFamily('')).toBe(BUILTIN_SERIAL_DATA_FONT_FAMILY)
    expect(normalizeSerialDataFontFamily(null)).toBe(BUILTIN_SERIAL_DATA_FONT_FAMILY)
  })

  it('应该清理控制字符和多余空白', () => {
    expect(normalizeSerialDataFontFamily('  Maple\n\tMono  ')).toBe('Maple Mono')
  })

  it('应该安全引用引号和反斜杠', () => {
    expect(quoteFontFamily('My "Mono" \\ Font')).toBe('"My \\"Mono\\" \\\\ Font"')
  })

  it('应该为自定义字体追加系统等宽兜底', () => {
    expect(createSerialDataFontStack('Sarasa Mono SC')).toBe('"Sarasa Mono SC", monospace')
    expect(createSerialDataFontStack('monospace')).toBe('monospace')
  })
})
