import { createGlobalState, useStorage } from '@vueuse/core'
import { ref } from 'vue'
import { useLayout } from '@/composables/useLayout'
import { useSettingStore } from '@/store/useSettingStore'

export const useRecordCache = createGlobalState(() => {
  const { recordCacheEnabled } = useSettingStore()
  const { showTerminalMode } = useLayout()

  const CACHE_PREFIX = 'session:' // 缓存前缀
  const BATCH_SIZE = 100 // 批量处理大小
  const DEBOUNCE_DELAY = 500 // 防抖延迟

  // 缓存状态
  const cacheSize = ref(0)

  // 会话管理状态
  const currentSessionId = ref(null)
  const sessionList = useStorage(`${CACHE_PREFIX}list`, ref([]))

  // 会话记录存储
  const sessionRecords = useStorage(`${CACHE_PREFIX}records`, ref({}))
  function getSessionRecords(sessionId) {
    return sessionRecords.value[`session_${sessionId}`]
  }
  function setSessionRecords(sessionId, records) {
    sessionRecords.value[`session_${sessionId}`] = records
  }
  function removeSessionRecords(sessionId) {
    delete sessionRecords.value[`session_${sessionId}`]
  }

  // 防抖定时器
  let debounceTimer = null

  // 生成会话ID
  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 格式化时间为会话标题
  function formatSessionTitle(timestamp = Date.now()) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  /**
   * 序列化记录数据
   * @param {Array} records - 记录数组
   * @returns {Array} 序列化后的记录数组
   */
  function serializeRecords(records) {
    return records.map(record => ({
      type: record.type,
      data: Array.from(record.data), // 将 Uint8Array 转换为普通数组
      time: record.time,
      timestamp: record.timestamp,
      display: record.display,
    }))
  }

  /**
   * 反序列化记录数据
   * @param {Array} serializedRecords - 序列化的记录数组
   * @returns {Array} 反序列化后的记录数组
   */
  function deserializeRecords(serializedRecords) {
    if (!Array.isArray(serializedRecords))
      return []

    return serializedRecords.map(record => ({
      ...record,
      data: new Uint8Array(record.data), // 将普通数组转换回 Uint8Array
    }))
  }

  /**
   * 创建新会话
   * @param {string} title - 会话标题，可选
   * @param {object} deviceInfo - 设备信息，可选
   * @returns {string} 会话ID
   */
  function createSession(title, deviceInfo = null) {
    const sessionId = generateSessionId()
    const sessionTitle = title || formatSessionTitle()

    const session = {
      id: sessionId,
      title: sessionTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recordCount: 0,
      deviceInfo: deviceInfo || {
        type: 'unknown', // 'serial' | 'bluetooth' | 'unknown'
        port: null,
        name: null,
        details: {}, // 额外的设备详细信息
      },
    }

    // 更新会话列表
    sessionList.value.unshift(session)

    // 设置为当前会话
    currentSessionId.value = sessionId

    return sessionId
  }

  /**
   * 保存会话记录
   * @param {Array} records - 要保存的记录数组
   * @param {string} sessionId - 会话ID
   */
  function saveSessionRecords(records, sessionId) {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || !records.length || showTerminalMode.value)
      return

    if (!sessionId) {
      console.error('sessionId不能为空')
      return
    }

    try {
      const serializedRecords = serializeRecords(records)
      setSessionRecords(sessionId, serializedRecords)

      // 更新会话信息
      updateSessionInfo(sessionId, {
        updatedAt: Date.now(),
        recordCount: serializedRecords.length,
      })

      cacheSize.value = serializedRecords.length
    }
    catch (error) {
      console.error('保存会话记录失败:', error)
    }
  }

  /**
   * 防抖保存会话记录
   * @param {Array} records - 要保存的记录数组
   * @param {string} sessionId - 会话ID，必需
   */
  function debouncedSaveSessionRecords(records, sessionId) {
    if (!sessionId) {
      console.error('sessionId不能为空')
      return
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      saveSessionRecords(records, sessionId)
    }, DEBOUNCE_DELAY)
  }

  /**
   * 从会话加载记录
   * @param {string} sessionId - 会话ID
   * @returns {Array} 加载的记录数组
   */
  function loadSessionRecords(sessionId) {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || showTerminalMode.value)
      return []

    if (!sessionId) {
      console.error('sessionId不能为空')
      return []
    }

    try {
      const serializedRecords = getSessionRecords(sessionId)
      if (!serializedRecords)
        return []

      const records = deserializeRecords(serializedRecords)
      cacheSize.value = records.length
      return records
    }
    catch (error) {
      console.error('从会话加载记录失败:', error)
      return []
    }
  }

  /**
   * 更新会话信息
   * @param {string} sessionId - 会话ID
   * @param {object} updates - 更新的字段
   */
  function updateSessionInfo(sessionId, updates) {
    const sessionIndex = sessionList.value.findIndex(s => s.id === sessionId)
    if (sessionIndex !== -1) {
      sessionList.value[sessionIndex] = {
        ...sessionList.value[sessionIndex],
        ...updates,
      }
    }
  }

  /**
   * 更新当前会话的设备信息
   * @param {object} deviceInfo - 设备信息
   */
  function updateCurrentSessionDevice(sessionId, deviceInfo) {
    if (!sessionId) {
      console.error('sessionId不能为空')
      return
    }

    if (sessionId) {
      updateSessionInfo(sessionId, {
        deviceInfo,
        updatedAt: Date.now(),
      })
    }
  }

  /**
   * 根据设备信息分组会话
   * @returns {object} 按设备分组的会话列表
   */
  function getSessionsByDevice() {
    const grouped = {
      serial: [],
      bluetooth: [],
      unknown: [],
    }

    sessionList.value.forEach((session) => {
      const deviceType = session.deviceInfo?.type || 'unknown'
      if (grouped[deviceType]) {
        grouped[deviceType].push(session)
      }
      else {
        grouped.unknown.push(session)
      }
    })

    return grouped
  }

  /**
   * 创建设备信息对象
   * @param {string} type - 设备类型 'serial' | 'bluetooth'
   * @param {string} port - 端口信息
   * @param {string} name - 设备名称
   * @param {object} details - 额外详细信息
   * @returns {object} 设备信息对象
   */
  function createDeviceInfo(type, port, name, details = {}) {
    return {
      type,
      port,
      name,
      details,
      timestamp: Date.now(),
    }
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   */
  function deleteSession(sessionId) {
    try {
      // 删除会话记录
      removeSessionRecords(sessionId)

      // 从会话列表中移除
      sessionList.value = sessionList.value.filter(s => s.id !== sessionId)

      // 如果删除的是当前会话，清空当前会话
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
        cacheSize.value = 0
      }
    }
    catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  /**
   * 清除所有会话数据
   */
  function clearAllSessions() {
    try {
      // 删除所有会话记录
      sessionRecords.value = {}

      // 清空会话列表
      sessionList.value = []

      // 重置当前会话
      currentSessionId.value = null
      cacheSize.value = 0
    }
    catch (error) {
      console.error('清除所有会话失败:', error)
    }
  }

  /**
   * 获取会话统计信息
   * @returns {object} 会话统计信息
   */
  function getSessionStats() {
    try {
      // 估算所有会话的总大小（字节）
      let estimatedSize = 0
      let totalRecords = 0

      for (const session of sessionList.value) {
        const records = session.records
        if (records) {
          estimatedSize += JSON.stringify(records).length
          totalRecords += records.length
        }
      }

      return {
        sessionCount: sessionList.value.length,
        totalRecords,
        totalKeys: sessionList.value.length,
        estimatedSize,
        formattedSize: formatBytes(estimatedSize),
      }
    }
    catch (error) {
      console.error('获取会话统计信息失败:', error)
      return {
        sessionCount: 0,
        totalRecords: 0,
        totalKeys: 0,
        estimatedSize: 0,
        formattedSize: '0 B',
      }
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小字符串
   */
  function formatBytes(bytes) {
    if (bytes === 0)
      return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * 优化大量数据的会话保存性能
   * @param {Array} records - 记录数组
   * @param {Function} onProgress - 进度回调函数
   * @param {string} sessionId - 会话ID
   */
  function optimizedSaveSessionRecords(records, onProgress, sessionId) {
    // 终端模式下禁用record缓存功能
    if (!recordCacheEnabled.value || !records.length || showTerminalMode.value)
      return

    if (!sessionId) {
      console.error('sessionId不能为空')
      return
    }

    try {
      // 分批处理大量数据
      const batches = []
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        batches.push(records.slice(i, i + BATCH_SIZE))
      }

      const serializedRecords = []

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const serializedBatch = serializeRecords(batch)
        serializedRecords.push(...serializedBatch)

        // 报告进度
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: batches.length,
            percentage: Math.round(((i + 1) / batches.length) * 100),
          })
        }
      }

      setSessionRecords(sessionId, serializedRecords)

      // 更新会话信息
      updateSessionInfo(sessionId, {
        updatedAt: Date.now(),
        recordCount: serializedRecords.length,
      })

      cacheSize.value = serializedRecords.length
    }
    catch (error) {
      console.error('优化保存会话记录失败:', error)
    }
  }

  return {
    // 状态
    cacheSize,
    currentSessionId,
    sessionList,
    sessionRecords,

    // 会话管理方法
    createSession,
    saveSessionRecords,
    debouncedSaveSessionRecords,
    loadSessionRecords,
    deleteSession,
    clearAllSessions,
    updateSessionInfo,
    updateCurrentSessionDevice,
    getSessionsByDevice,
    createDeviceInfo,
    getSessionStats,
    optimizedSaveSessionRecords,

    // 工具方法
    serializeRecords,
    deserializeRecords,
    formatBytes,
    generateSessionId,
    formatSessionTitle,
  }
})
