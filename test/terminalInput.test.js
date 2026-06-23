import { describe, expect, it } from 'vitest'
import { normalizeTerminalInput } from '../src/components/TerminalPanel/terminalInput.js'

describe('normalizeTerminalInput', () => {
  it('终端输入单独回车时应该替换为设置中的回车序列', () => {
    expect(normalizeTerminalInput('\r', '\r\n')).toBe('\r\n')
    expect(normalizeTerminalInput('\r', '\n')).toBe('\n')
  })

  it('非单独回车输入应该保持原样', () => {
    expect(normalizeTerminalInput('a', '\r\n')).toBe('a')
    expect(normalizeTerminalInput('\r\n', '\n')).toBe('\r\n')
    expect(normalizeTerminalInput('\u001B[A', '\r\n')).toBe('\u001B[A')
  })
})
