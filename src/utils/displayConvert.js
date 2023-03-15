export function arrayBuffer2Hex(buffer) {
  return Array.from(buffer)
    .map((i) => "0x" + i.toString(16).padStart(2, "0"))
    .join(",");
}
