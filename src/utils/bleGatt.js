const SHORT_GATT_UUID_PATTERN = /^(?:0x)?([0-9a-f]{4}|[0-9a-f]{8})$/i
const FULL_GATT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * 将用户输入标准化为 Web Bluetooth 可接受的 UUID
 * @param {string | number} value 用户输入的 16 位、32 位或 128 位 UUID
 * @param {string} fieldName UUID 对应的字段名称，用于生成错误信息
 * @returns {number | string} 短 UUID 对应的数值或小写的完整 UUID
 */
export function normalizeGattUuid(value, fieldName = 'UUID') {
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF)
      return value
    throw new TypeError(`${fieldName} 必须是有效的 16 位、32 位或 128 位 UUID`)
  }

  const normalizedValue = String(value ?? '').trim()
  const shortMatch = normalizedValue.match(SHORT_GATT_UUID_PATTERN)
  if (shortMatch)
    return Number.parseInt(shortMatch[1], 16)

  if (FULL_GATT_UUID_PATTERN.test(normalizedValue))
    return normalizedValue.toLowerCase()

  throw new TypeError(`${fieldName} 必须是有效的 16 位、32 位或 128 位 UUID`)
}

/**
 * 校验并标准化一组 GATT 串口透传配置
 * @param {object} profile 待校验的 GATT 配置
 * @param {string | number} profile.service 服务 UUID
 * @param {string | number} profile.writeCharacteristic 写入特征 UUID
 * @param {string | number} [profile.notifyCharacteristic] 可选的通知特征 UUID
 * @returns {object} 保留原配置字段且 UUID 已标准化的新配置
 */
export function normalizeGattProfile(profile) {
  const normalizedProfile = {
    ...profile,
    service: normalizeGattUuid(profile?.service, '服务 UUID'),
    writeCharacteristic: normalizeGattUuid(profile?.writeCharacteristic, '写入特征 UUID'),
  }

  const notifyCharacteristic = profile?.notifyCharacteristic
  const hasNotifyCharacteristic = notifyCharacteristic !== undefined
    && notifyCharacteristic !== null
    && String(notifyCharacteristic).trim() !== ''
  normalizedProfile.notifyCharacteristic = hasNotifyCharacteristic
    ? normalizeGattUuid(notifyCharacteristic, '通知特征 UUID')
    : undefined

  return normalizedProfile
}

/**
 * 获取 GATT 配置的校验结果，供界面在连接前展示
 * @param {object} profile 待校验的 GATT 配置
 * @returns {{ valid: boolean, error: string, profile?: object }} 校验状态、错误信息和标准化后的配置
 */
export function validateGattProfile(profile) {
  try {
    return {
      valid: true,
      error: '',
      profile: normalizeGattProfile(profile),
    }
  }
  catch (error) {
    return {
      valid: false,
      error: error?.message || String(error),
    }
  }
}

/**
 * 根据预设或自定义配置生成 Web Bluetooth 设备请求参数
 * @param {object} profile 已标准化的 GATT 配置
 * @returns {RequestDeviceOptions} Web Bluetooth 设备选择参数
 */
export function createGattRequestOptions(profile) {
  if (profile.custom) {
    return {
      acceptAllDevices: true,
      optionalServices: [profile.service],
    }
  }

  return {
    filters: [{ services: [profile.service] }],
  }
}

/**
 * 按特征能力选择合适的 GATT 写入接口并发送数据
 * @param {BluetoothRemoteGATTCharacteristic} characteristic 目标写入特征
 * @param {BufferSource} data 待发送的二进制数据
 * @returns {Promise<void>} 写入完成后解决的 Promise
 */
export async function writeGattValue(characteristic, data) {
  const properties = characteristic?.properties

  if (properties?.writeWithoutResponse && typeof characteristic.writeValueWithoutResponse === 'function') {
    await characteristic.writeValueWithoutResponse(data)
    return
  }

  if (properties?.write && typeof characteristic.writeValueWithResponse === 'function') {
    await characteristic.writeValueWithResponse(data)
    return
  }

  if (
    typeof characteristic?.writeValue === 'function'
    && (!properties || properties.write || properties.writeWithoutResponse)
  ) {
    await characteristic.writeValue(data)
    return
  }

  throw new Error('所选特征不支持 GATT 写入')
}
