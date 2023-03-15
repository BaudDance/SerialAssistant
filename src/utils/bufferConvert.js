/**
 * 有三类数据需要转换
 * 1. 普通字符串(str) 例如"hello world" "你好123"
 * 2. HexFormat字符串(hexFormat) 例如"0x12,0x23"
 * 3. 不带0x的Hex字符串(hexStr) 例如"1223"
 * 3. Uint8Array(buffer) 例如[0x12,0x23]
 */

import str2gbk from "str2gbk";
const gbkDecoder = new TextDecoder("gbk");
export function arrayBuffer2Hex(buffer) {
  return Array.from(buffer)
    .map((i) => "0x" + i.toString(16).padStart(2, "0"))
    .join(",");
}

export function hex2ArrayBuffer(hexString) {
  return Uint8Array.from(
    hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}

/**
 *
 * @param {*} str "你好123"
 * @returns [0xc4,0xe3,0xba,0xc3,0x31,0x32,0x33]
 */
export function strToBuffer(str) {
  return str2gbk(str);
}

/**
 *
 * @param {*} buffer [0xc4,0xe3,0xba,0xc3,0x31,0x32,0x33]
 * @returns "你好123"
 */
export function bufferToStr(buffer) {
  return gbkDecoder.decode(buffer);
}

/**
 * 将buffer转换为hexStr格式
 * @param {*} str [0xc4,0xe3,0xba,0xc3,0x31,0x32,0x33]
 * @returns "c4e3bac3313233"
 */
export function bufferToHexStr(buffer) {
  return Array.from(buffer)
    .map((i) => i.toString(16).padStart(2, "0"))
    .join("");
}

export function hexStrToBuffer(str) {
  console.log(str);
  return Uint8Array.from(
    str.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}

/**
 * 将str转换为hexStr格式
 * 会先转为buffer再转为hexStr
 * @param {*} str "你好123"
 * @returns "c4e3bac3313233"
 */
export function strToHexStr(str) {
  return bufferToHexStr(strToBuffer(str));
}

export function hexStrToStr(str) {
  return bufferToStr(hexStrToBuffer(str));
}

export function strToHexFormat(str) {
  return hexStrToHexFormat(strToHexStr(str));
}
export function hexFormatToStr(str) {
  return hexStrToStr(hexFormatToHexStr(str));
}

/**
 * 将str转换为hexFormat格式
 * @param {*} str "你好123"
 * @returns "0xc4,0xe3,0xba,0xc3,0x31,0x32,0x33"
 */
export function hexStrToHexFormat(str) {
  const clearStr = hexFormatToHexStr(str);
  const result = [];
  for (let i = 0; i < clearStr.length; i += 2) {
    result.push("0x" + clearStr.slice(i, i + 2));
  }
  return result.join(", ");
}

/**
 * 将hexFormat转换为hexStr格式
 * @param {*} str "0xc4,0xe3,0xba,0xc3,0x31,0x32,0x33"
 * @returns "c4e3bac3313233"
 */
export function hexFormatToHexStr(str) {
  return str.replaceAll(", ", "").replaceAll("0x", "");
}

export function isHexStr(str) {
  let clearStr = hexFormatToHexStr(str);
  return true && clearStr.match(/^[0-9a-fA-F]+$/);
}
