import { useLocalStorage } from "@vueuse/core";
import str2gbk from "str2gbk";
// 编码 UTF-8 GBK
const dataCode = useLocalStorage("dataCode", "UTF-8", {
  listenToStorageChanges: false,
});

const gbkDecoder = new TextDecoder("gbk");
const utf8Decoder = new TextDecoder();

function hexStringToHexFormat(str) {
  return "0x" + str.match(/.{1,2}/g).join(", 0x");
}

function hexStringToBuffer(str) {
  return Uint8Array.from(
    str.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}

function bufferToHexFormat(buffer) {
  return Array.from(buffer)
    .map((i) => "0x" + i.toString(16).padStart(2, "0"))
    .join(", ");
}

function stringToBuffer(str) {
  if (dataCode.value === "UTF-8") {
    return new TextEncoder().encode(str);
  }
  return str2gbk(str);
}

function bufferToString(buffer) {
  if (dataCode.value === "UTF-8") {
    console.log("UTF-8", buffer);
    return utf8Decoder.decode(buffer);
  }
  console.log("GBK", buffer);
  return gbkDecoder.decode(buffer);
}

function stringToHexFormat(str) {
  return bufferToHexFormat(stringToBuffer(str));
}

function stringToHtml(str) {
  return str
    .replaceAll(" ", "&nbsp;")
    .replaceAll("\r\n", "<br/>")
    .replaceAll("\n", "<br/>")
    .replaceAll("\r", "<br/>");
}

export function useDataCode() {
  return {
    hexStringToHexFormat,
    hexStringToBuffer,
    bufferToHexFormat,
    stringToBuffer,
    bufferToString,
    stringToHexFormat,
    stringToHtml,
    dataCode,
  };
}
