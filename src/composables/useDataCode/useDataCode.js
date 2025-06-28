import { useLocalStorage } from '@vueuse/core'
import str2gbk from 'str2gbk'
// 编码 UTF-8 GBK
const dataCode = useLocalStorage('dataCode', 'UTF-8', {
  listenToStorageChanges: false,
})

const gbkDecoder = new TextDecoder('gbk')
const utf8Decoder = new TextDecoder()

function hexStringToHexFormat(str) {
  return (
    `0x${
      str
        .match(/.{1,2}/g)
        .map(i => i.toUpperCase())
        .join(', 0x')}`
  )
}

function hexStringToBuffer(str) {
  return Uint8Array.from(
    str.match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16)),
  )
}

function bufferToHexString(buffer) {
  return Array.from(buffer)
    .map(i => i.toString(16).padStart(2, '0').toUpperCase())
    .join('')
}

function bufferToHexFormat(buffer) {
  return Array.from(buffer)
    .map(i => `0x${i.toString(16).padStart(2, '0').toUpperCase()}`)
    .join(', ')
}

function bufferToString(buffer) {
  if (dataCode.value === 'UTF-8') {
    return utf8Decoder.decode(buffer)
  }
  return gbkDecoder.decode(buffer)
}
function stringToBuffer(str) {
  if (dataCode.value === 'UTF-8') {
    return new TextEncoder().encode(str)
  }
  return str2gbk(str)
}

function stringToHexFormat(str) {
  return bufferToHexFormat(stringToBuffer(str))
}

function stringToHexString(str) {
  return bufferToHexString(stringToBuffer(str))
}

function decStringToBuffer(str) {
  return hexStringToBuffer(Number.parseInt(str).toString(16))
}

function bufferToDecString(buffer) {
  return Number.parseInt(bufferToHexString(buffer), 16).toString()
}

function stringToHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(' ', '&nbsp;')
    .replaceAll('\r\n', '<br/>')
    .replaceAll('\n', '<br/>')
    .replaceAll('\r', '<br/>')
}

export function isHexString(str) {
  return true && str.match(/^[0-9a-f]+$/i)
}
export function useDataCode() {
  return {
    decStringToBuffer,
    hexStringToHexFormat,
    hexStringToBuffer,
    bufferToHexString,
    bufferToHexFormat,
    bufferToDecFormat: bufferToDecString,
    bufferToString,
    stringToBuffer,
    stringToHexFormat,
    stringToHexString,
    stringToHtml,
    isHexString,
    dataCode,
  }
}
