// 检测操作系统
export function getOS() {
  const ua = navigator.userAgent
  const plat = navigator.platform
  if (/Mac|iPod|iPhone|iPad/.test(plat))
    return /iPhone|iPad|iPod/.test(ua) ? 'iOS' : 'MacOS'
  // eslint-disable-next-line regexp/no-dupe-disjunctions
  if (/Win|Windows/.test(plat) || /Win|Windows/.test(ua))
    return 'Windows'
  if (/Linux/.test(plat) && !/Android/.test(ua))
    return 'Linux'
  return 'Unknown'
}
