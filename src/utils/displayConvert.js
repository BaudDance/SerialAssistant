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
