import { createGlobalState, useMagicKeys } from '@vueuse/core'
import { computed, inject, ref, watch } from 'vue'
import { useCheckDigit } from '@/composables/useCheckDigit/useCheckDigit'
import { useDataCode } from '@/composables/useDataCode/useDataCode'

import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'

import { getOS } from '@/utils/os'

export const useSendStore = createGlobalState(() => {
  const { sendHex: serialSendHex } = inject('serial')
  const { sendHex: bleSendHex } = inject('ble')
  const { records, addRecord } = useRecordStore()
  const { lineEnding, deviceType, sendHexInputMode } = useSettingStore()
  const { sendType } = useSerialStore()
  const { checkAlgorithm, checkAlgorithms } = useCheckDigit()

  const {
    decStringToBuffer,
    hexStringToBuffer,
    stringToBuffer,
    stringToHexString,
    isHexString,
    bufferToHexFormat,
  } = useDataCode()

  const isAutoSending = ref(false)

  const sendData = ref('')
  const historyIndex = ref(-1) // -1表示当前输入，0及以上表示历史记录索引

  const checkDigit = computed(() => {
    if (!checkAlgorithm.value || sendType.value !== 'hex')
      return undefined
    if (sendData.value.length === 0)
      return [0x00]
    return checkAlgorithms.value.find(item => item.name === checkAlgorithm.value)?.algorithm(
      hexStringToBuffer(sendData.value.replaceAll(' ', '')),
    )
  })

  const sendBuffer = computed(() => {
    if (sendType.value === 'hex') {
      if (checkDigit.value) {
        return Uint8Array.from([
          ...hexStringToBuffer(sendData.value.replaceAll(' ', '')),
          ...checkDigit.value,
        ])
      }
      return hexStringToBuffer(sendData.value.replaceAll(' ', ''))
    }
    else if (sendType.value === 'ascii') {
      console.log('ascii', stringToBuffer(sendData.value + lineEnding.value))
      return stringToBuffer(sendData.value + lineEnding.value)
    }
    else {
      console.log('dec', decStringToBuffer(sendData.value.replaceAll(' ', '')))
      return decStringToBuffer(sendData.value.replaceAll(' ', ''))
    }
  })

  const checkDigitHexFormat = computed(() => {
    if (!checkAlgorithm.value)
      return undefined
    return bufferToHexFormat(checkDigit.value)
  })

  async function sendHex(data) {
    if (deviceType.value === 'serial') {
      await serialSendHex(data)
    }
    else {
      await bleSendHex(data)
    }
  }

  async function send() {
    await sendHex(sendBuffer.value)
    addRecord({
      type: 'write',
      data: sendBuffer.value,
      time: new Date(),
      display: sendType.value,
    })
  }
  watch(sendType, (value) => {
    if (!sendData.value)
      return
    if (value === 'hex') {
    // 若为普通字符串,先取编码,然后转换为hex格式
      if (!isHexString(sendData.value)) {
        sendData.value = stringToHexString(sendData.value)
      }
    }
  })

  const sendHistory = computed(() => {
    return records.value.filter(item => item.type === 'write')
  })

  function onInput() {
    // 当用户手动输入时，重置历史索引
    resetHistoryIndex()

    if (sendType.value === 'hex') {
      sendData.value = sendData.value
        .replace(/([^0-9a-f ])/i, '')
        .toUpperCase()
    }
    else if (sendType.value === 'dec') {
      sendData.value = sendData.value
        .replace(/(\D)/, '')
    }
  }

  function clear() {
    sendData.value = ''
  }

  const keys = useMagicKeys({
    passive: false,
    onEventFired(e) {
      if (e.ctrlKey && e.key === 's' && e.type === 'keydown')
        e.preventDefault()
      if (e.key === 'Enter' && e.type === 'keydown') {
        e.preventDefault()
      }
    },
  })

  // 根据操作系统选择合适的快捷键
  const isMac = (getOS() === 'MacOS' || getOS() === 'iOS')
  const enter = keys.Enter
  const saveKey = isMac ? keys['Cmd+S'] : keys['Ctrl+S']
  const up = keys.Up
  const down = keys.Down

  watch(enter, (v) => {
    if (v) {
      console.log('Enter have been pressed')
      send()
    }
  })

  watch(saveKey, (v) => {
    if (v) {
      console.log('Ctrl + S have been pressed')
      reformat()
    }
  })

  watch(up, (v) => {
    if (v) {
      console.log('Up have been pressed')
      navigateHistory('up')
    }
  })
  watch(down, (v) => {
    if (v) {
      console.log('Down have been pressed')
      navigateHistory('down')
    }
  })

  function reformat() {
    if (sendType.value === 'hex') {
      reformatHex()
    }
  }

  function reformatHex() {
    if (sendData.value.length === 0)
      return
    let data = sendData.value
    // 首先使用空格分割 并去掉空字符串
    data = data.split(' ').filter(item => item)
    // 在长度为奇数的字符串的最后一位前补0
    data = data.map((item) => {
      if (item.length % 2 === 1) {
      // 最后一位前补0
        return `${item.slice(0, item.length - 1)}0${item.slice(item.length - 1)}`
      }
      return item
    })
    // 将数组转换为字符串
    data = data.join('')
    // 将字符串按照每两个字符分割
    data = data.match(/.{1,2}/g)
    // 将数组转换为字符串
    data = data.join(' ')
    sendData.value = data
  }

  function navigateHistory(direction) {
    const history = sendHistory.value
    console.log('History length:', history.length)
    if (history.length === 0)
      return

    const oldIndex = historyIndex.value

    if (direction === 'up') {
      // 向上导航到更早的历史记录
      if (historyIndex.value < history.length - 1) {
        historyIndex.value++
      }
      else if (historyIndex.value === -1) {
        // 从当前输入状态开始，显示最新的历史记录
        historyIndex.value = 0
      }
    }
    else if (direction === 'down') {
      // 向下导航到更新的历史记录
      if (historyIndex.value > 0) {
        historyIndex.value--
      }
      else if (historyIndex.value === 0) {
        // 回到当前输入状态
        historyIndex.value = -1
      }
    }

    console.log('History index changed from', oldIndex, 'to', historyIndex.value)

    // 根据索引设置sendData
    if (historyIndex.value === -1) {
      // 回到当前输入状态，清空输入框
      sendData.value = ''
      console.log('Cleared input')
    }
    else {
      // 显示历史记录
      const record = history[history.length - 1 - historyIndex.value]
      console.log('Selected record:', record)
      if (record) {
        console.log('Record display type:', record.display)
        console.log('Current sendType:', sendType.value)
        console.log('Record data:', record.data)

        // 根据历史记录的原始发送类型格式化数据
        if (record.display === 'hex') {
          sendData.value = bufferToHexFormat(record.data)
        }
        else if (record.display === 'ascii') {
          // 移除行结束符
          const decoder = new TextDecoder()
          let text = decoder.decode(record.data)
          console.log('Decoded text:', JSON.stringify(text))
          console.log('Line ending:', JSON.stringify(lineEnding.value))
          // 只有当行结束符不为空且文本确实以行结束符结尾时才移除
          if (lineEnding.value && text.endsWith(lineEnding.value)) {
            text = text.slice(0, -lineEnding.value.length)
          }
          sendData.value = text
        }
        else {
          // dec格式
          sendData.value = Array.from(record.data).join(' ')
        }
        console.log('Set sendData to:', JSON.stringify(sendData.value))
      }
    }
  }

  // 当用户手动输入时，重置历史索引
  function resetHistoryIndex() {
    historyIndex.value = -1
  }

  return {
    isAutoSending,
    sendData,
    clear,
    sendHistory,
    onInput,
    sendBuffer,
    send,
    sendType,
    checkAlgorithm,
    checkAlgorithms,
    checkDigitHexFormat,
    reformat,
    resetHistoryIndex,
    historyIndex,
    navigateHistory,
  }
})
