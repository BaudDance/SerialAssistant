import { describe, expect, it, vi } from 'vitest'
import {
  createGattRequestOptions,
  normalizeGattProfile,
  normalizeGattUuid,
  validateGattProfile,
  writeGattValue,
} from '../src/utils/bleGatt'

describe('ble GATT 配置', () => {
  it('标准化 16 位和 32 位短 UUID', () => {
    expect(normalizeGattUuid('FFE0')).toBe(0xFFE0)
    expect(normalizeGattUuid('0x12345678')).toBe(0x12345678)
  })

  it('标准化 128 位 UUID', () => {
    expect(normalizeGattUuid('6E400001-B5A3-F393-E0A9-E50E24DCCA9E'))
      .toBe('6e400001-b5a3-f393-e0a9-e50e24dcca9e')
  })

  it('拒绝格式错误的 UUID', () => {
    expect(() => normalizeGattUuid('FFE')).toThrow('16 位、32 位或 128 位 UUID')
    expect(validateGattProfile({
      service: 'FFE0',
      writeCharacteristic: '',
    })).toEqual(expect.objectContaining({
      valid: false,
      error: expect.stringContaining('写入特征 UUID'),
    }))
  })

  it('允许通知特征留空', () => {
    expect(normalizeGattProfile({
      service: 'FFE0',
      writeCharacteristic: 'FFE1',
      notifyCharacteristic: ' ',
    })).toEqual(expect.objectContaining({
      service: 0xFFE0,
      writeCharacteristic: 0xFFE1,
      notifyCharacteristic: undefined,
    }))
  })

  it('保留预设中的数值型通知 UUID', () => {
    expect(normalizeGattProfile({
      service: 0xFFE0,
      writeCharacteristic: 0xFFE1,
      notifyCharacteristic: 0xFFE1,
    })).toEqual(expect.objectContaining({
      service: 0xFFE0,
      writeCharacteristic: 0xFFE1,
      notifyCharacteristic: 0xFFE1,
    }))
  })

  it('为预设配置使用服务过滤器', () => {
    expect(createGattRequestOptions({ service: 0xFFE0 })).toEqual({
      filters: [{ services: [0xFFE0] }],
    })
  })

  it('为自定义配置授权服务并显示全部设备', () => {
    const service = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
    expect(createGattRequestOptions({ custom: true, service })).toEqual({
      acceptAllDevices: true,
      optionalServices: [service],
    })
  })
})

describe('ble GATT 写入', () => {
  it('优先使用无响应写入', async () => {
    const characteristic = {
      properties: { write: true, writeWithoutResponse: true },
      writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
      writeValueWithResponse: vi.fn().mockResolvedValue(undefined),
    }
    const data = Uint8Array.of(0x01, 0x02)

    await writeGattValue(characteristic, data)

    expect(characteristic.writeValueWithoutResponse).toHaveBeenCalledWith(data)
    expect(characteristic.writeValueWithResponse).not.toHaveBeenCalled()
  })

  it('支持仅带响应写入的特征', async () => {
    const characteristic = {
      properties: { write: true, writeWithoutResponse: false },
      writeValueWithResponse: vi.fn().mockResolvedValue(undefined),
    }
    const data = Uint8Array.of(0x03)

    await writeGattValue(characteristic, data)

    expect(characteristic.writeValueWithResponse).toHaveBeenCalledWith(data)
  })

  it('兼容旧版 writeValue 接口', async () => {
    const characteristic = {
      properties: { write: true, writeWithoutResponse: false },
      writeValue: vi.fn().mockResolvedValue(undefined),
    }
    const data = Uint8Array.of(0x04)

    await writeGattValue(characteristic, data)

    expect(characteristic.writeValue).toHaveBeenCalledWith(data)
  })

  it('拒绝不可写特征', async () => {
    await expect(writeGattValue({
      properties: { write: false, writeWithoutResponse: false },
    }, Uint8Array.of(0x05))).rejects.toThrow('不支持 GATT 写入')
  })
})
