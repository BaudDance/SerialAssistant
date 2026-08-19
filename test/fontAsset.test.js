import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const fontPath = resolve(process.cwd(), 'public/fonts/JetBrainsMapleMono-Regular-1.2304.79.woff2')
const licensePath = resolve(process.cwd(), 'public/fonts/JetBrainsMapleMono-OFL.txt')

describe('内置收发字体资产', () => {
  it('应该保留固定版本和校验值', () => {
    const font = readFileSync(fontPath)
    const digest = createHash('sha256').update(font).digest('hex')

    expect(font.subarray(0, 4).toString()).toBe('wOF2')
    expect(font.byteLength).toBe(5_580_172)
    expect(digest).toBe('d88f1b5e5e925f419076024ea74d141f7c926376e40459fd1eafa8ab585a9fb5')
  })

  it('应该随字体分发 OFL 许可证', () => {
    expect(readFileSync(licensePath, 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })
})
