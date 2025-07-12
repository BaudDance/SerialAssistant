import { describe, expect, it } from 'vitest'
import { useCheckDigit } from '../src/composables/useCheckDigit/useCheckDigit.js'

describe('useCheckDigit', () => {
  const { checkAlgorithms } = useCheckDigit()

  describe('校验和算法', () => {
    const checksumAlgorithm = checkAlgorithms.value.find(algo => algo.name === '校验和')

    it('应该正确计算空数组的校验和', () => {
      const data = new Uint8Array([])
      const result = checksumAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0]))
    })

    it('应该正确计算单个字节的校验和', () => {
      const data = new Uint8Array([0x42])
      const result = checksumAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x42]))
    })

    it('应该正确计算多个字节的校验和', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const result = checksumAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x0A])) // 1+2+3+4=10=0x0A
    })

    it('应该正确处理溢出情况（取低8位）', () => {
      const data = new Uint8Array([0xFF, 0xFF, 0x02])
      const result = checksumAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x00])) // (255+255+2) & 0xFF = 512 & 0xFF = 0
    })

    it('应该正确计算较大数据的校验和', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
      const result = checksumAlgorithm.algorithm(data)
      const expected = (0x12 + 0x34 + 0x56 + 0x78 + 0x9A + 0xBC + 0xDE + 0xF0) & 0xFF
      expect(result).toEqual(new Uint8Array([expected]))
    })
  })

  describe('奇偶校验算法', () => {
    const parityAlgorithm = checkAlgorithms.value.find(algo => algo.name === '奇偶校验')

    it('应该正确计算空数组的奇偶校验', () => {
      const data = new Uint8Array([])
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0])) // 空数组和为0，偶数
    })

    it('应该正确计算单个字节的奇偶校验', () => {
      const data = new Uint8Array([0x05]) // 5是奇数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([1])) // 奇数返回1
    })

    it('应该正确计算偶数和的奇偶校验', () => {
      const data = new Uint8Array([0x02, 0x04]) // 2+4=6，偶数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0])) // 偶数返回0
    })

    it('应该正确计算奇数和的奇偶校验', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]) // 1+2+3=6，偶数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0])) // 偶数返回0
    })

    it('应该正确处理奇数和的情况', () => {
      const data = new Uint8Array([0x01, 0x02]) // 1+2=3，奇数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([1])) // 奇数返回1
    })

    it('应该正确处理大数值的奇偶校验', () => {
      const data = new Uint8Array([0xFF, 0xFF]) // 255+255=510，偶数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0])) // 偶数返回0
    })

    it('应该正确处理复杂数据的奇偶校验', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]) // 18+52+86+120=276，偶数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0])) // 偶数返回0
    })

    it('应该验证奇偶校验的二进制特性', () => {
      const data = new Uint8Array([0x01, 0x03, 0x05]) // 1+3+5=9，奇数
      const result = parityAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([1])) // 奇数返回1
    })
  })

  describe('异或校验算法', () => {
    const xorAlgorithm = checkAlgorithms.value.find(algo => algo.name === '异或校验')

    it('应该正确计算空数组的异或校验', () => {
      const data = new Uint8Array([])
      const result = xorAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0]))
    })

    it('应该正确计算单个字节的异或校验', () => {
      const data = new Uint8Array([0x42])
      const result = xorAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x42]))
    })

    it('应该正确计算多个字节的异或校验', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04])
      const result = xorAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x04])) // 1^2^3^4=4
    })

    it('应该正确处理相同字节的异或（结果为0）', () => {
      const data = new Uint8Array([0x55, 0x55])
      const result = xorAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0x00])) // 0x55 ^ 0x55 = 0
    })

    it('应该正确计算复杂数据的异或校验', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result = xorAlgorithm.algorithm(data)
      const expected = 0x12 ^ 0x34 ^ 0x56 ^ 0x78
      expect(result).toEqual(new Uint8Array([expected]))
    })

    it('应该验证异或的可逆性', () => {
      const data = new Uint8Array([0xAA, 0xBB, 0xCC])
      const checksum = xorAlgorithm.algorithm(data)
      const dataWithChecksum = new Uint8Array([...data, ...checksum])
      const verification = xorAlgorithm.algorithm(dataWithChecksum)
      expect(verification).toEqual(new Uint8Array([0x00]))
    })
  })

  describe('modbusCRC16算法', () => {
    const crcAlgorithm = checkAlgorithms.value.find(algo => algo.name === 'ModbusCRC16')

    it('应该正确计算空数组的CRC16', () => {
      const data = new Uint8Array([])
      const result = crcAlgorithm.algorithm(data)
      expect(result).toEqual(new Uint8Array([0xFF, 0xFF])) // 初始值0xFFFF
    })

    it('应该正确计算单个字节的CRC16', () => {
      const data = new Uint8Array([0x01])
      const result = crcAlgorithm.algorithm(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(2)
      // 验证具体的CRC16计算结果
      expect(result).toEqual(new Uint8Array([126, 128])) // 0x7E, 0x80
    })

    it('应该正确计算已知数据的CRC16', () => {
      // 测试已知的Modbus CRC16值
      const data = new Uint8Array([0x01, 0x04, 0x02, 0xFF, 0xFF])
      const result = crcAlgorithm.algorithm(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(2)
      // 验证具体的CRC16计算结果
      expect(result).toEqual(new Uint8Array([184, 128])) // 0xB8, 0x80
    })

    it('应该正确计算Modbus RTU帧的CRC16', () => {
      // 典型的Modbus RTU帧：设备地址01，功能码03，起始地址0000，寄存器数量0001
      const data = new Uint8Array([0x01, 0x03, 0x00, 0x00, 0x00, 0x01])
      const result = crcAlgorithm.algorithm(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(2)
      // 验证具体的CRC16计算结果
      expect(result).toEqual(new Uint8Array([132, 10])) // 0x84, 0x0A
    })

    it('应该验证CRC16的一致性', () => {
      const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
      const result1 = crcAlgorithm.algorithm(data)
      const result2 = crcAlgorithm.algorithm(data)
      expect(result1).toEqual(result2) // 相同输入应该产生相同输出
    })

    it('应该验证不同数据产生不同的CRC16', () => {
      const data1 = new Uint8Array([0x01, 0x02, 0x03])
      const data2 = new Uint8Array([0x01, 0x02, 0x04])
      const result1 = crcAlgorithm.algorithm(data1)
      const result2 = crcAlgorithm.algorithm(data2)
      expect(result1).not.toEqual(result2) // 不同输入应该产生不同输出
    })

    it('应该正确处理较长的数据', () => {
      const data = new Uint8Array(Array.from({ length: 100 }, (_, i) => i % 256))
      const result = crcAlgorithm.algorithm(data)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(2)
      // 验证具体的CRC16计算结果
      expect(result).toEqual(new Uint8Array([235, 43])) // 0xEB, 0x2B
    })
  })

  describe('algorithm array integrity', () => {
    it('应该包含所有预期的算法', () => {
      expect(checkAlgorithms.value).toHaveLength(4)

      const algorithmNames = checkAlgorithms.value.map(algo => algo.name)
      expect(algorithmNames).toContain('校验和')
      expect(algorithmNames).toContain('奇偶校验')
      expect(algorithmNames).toContain('异或校验')
      expect(algorithmNames).toContain('ModbusCRC16')
    })

    it('每个算法都应该有name和algorithm属性', () => {
      checkAlgorithms.value.forEach((algo) => {
        expect(algo).toHaveProperty('name')
        expect(algo).toHaveProperty('algorithm')
        expect(typeof algo.name).toBe('string')
        expect(typeof algo.algorithm).toBe('function')
      })
    })

    it('每个算法函数都应该返回Uint8Array', () => {
      const testData = new Uint8Array([0x01, 0x02, 0x03])

      checkAlgorithms.value.forEach((algo) => {
        const result = algo.algorithm(testData)
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })
})
