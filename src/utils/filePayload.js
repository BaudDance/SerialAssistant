export const FILE_RECORD_DISPLAY = 'file'
export const FILE_SEND_CHUNK_SIZE = 16 * 1024
export const LARGE_FILE_WARNING_SIZE = 1024 * 1024

export function toUint8Array(data) {
  if (data instanceof Uint8Array)
    return data
  if (data instanceof ArrayBuffer)
    return new Uint8Array(data)
  if (ArrayBuffer.isView(data))
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return new Uint8Array(data || [])
}

export function copyToUint8Array(data) {
  return new Uint8Array(toUint8Array(data))
}

export function createFileMeta(fileOrMeta = {}, fallbackSize = 0) {
  return {
    name: fileOrMeta.name || '未命名文件',
    size: Number.isFinite(fileOrMeta.size) ? fileOrMeta.size : fallbackSize,
    type: fileOrMeta.type || '',
    lastModified: fileOrMeta.lastModified || 0,
  }
}

export function createFilePayload({ data, file, fileMeta }) {
  const bytes = copyToUint8Array(data)
  return {
    ...createFileMeta(file || fileMeta, bytes.byteLength),
    data: bytes,
  }
}

export function fileMetaFromPayload(payload) {
  return createFileMeta(payload, payload?.data?.byteLength || payload?.size || 0)
}

export function formatFileSize(size = 0) {
  if (!Number.isFinite(size))
    return '0 B'

  if (size < 1024)
    return `${size} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unitIndex]}`
}

export function fileSummaryText(fileMeta = {}, byteLength = fileMeta.size || 0) {
  const meta = createFileMeta(fileMeta, byteLength)
  return `${meta.name} (${formatFileSize(meta.size || byteLength)})`
}
