import { createGlobalState, useMagicKeys } from '@vueuse/core'
import { computed, inject, ref, watch } from 'vue'
import { useRecordStore } from '@/store/useRecordStore'
import { useSerialStore } from '@/store/useSerialStore'

import { useSettingStore } from '@/store/useSettingStore'
import { useCheckDigit } from '@/utils/useCheckDigit/useCheckDigit'
import { useDataCode } from '@/utils/useDataCode/useDataCode'

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
    // await sendHex(sendBuffer.value)
    addRecord({
      type: 'write',
      data: sendBuffer.value,
      time: new Date(),
      display: sendType.value,
    })
    addRecord({
      type: 'read',
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

  function onInput() {
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

  const keys = useMagicKeys()
  const enter = keys.Enter
  const ctrlS = keys['Ctrl+S']

  watch(enter, (v) => {
    if (v) {
      console.log('Enter have been pressed')
      send()
    }
  })

  watch(ctrlS, (v) => {
    if (v) {
      console.log('Ctrl + S have been pressed')
      reformat()
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

  return {
    isAutoSending,
    sendData,
    clear,
    onInput,
    sendBuffer,
    send,
    sendType,
    checkAlgorithm,
    checkAlgorithms,
    checkDigitHexFormat,
    reformat,
  }
})
