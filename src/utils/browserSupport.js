export const SERIAL_BROWSER_SUPPORT_REASONS = {
  MOBILE: 'mobile',
  INSECURE_CONTEXT: 'insecure-context',
  UNSUPPORTED_BROWSER: 'unsupported-browser',
}

const MOBILE_USER_AGENT_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i
const TRUSTED_LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

function resolveNavigator(navigatorOption) {
  if (navigatorOption)
    return navigatorOption

  if (typeof navigator !== 'undefined')
    return navigator

  return undefined
}

function resolveWindow(windowOption) {
  if (windowOption)
    return windowOption

  if (typeof window !== 'undefined')
    return window

  return undefined
}

export function hasWebSerial(options = {}) {
  const currentNavigator = resolveNavigator(options.navigator)

  return !!currentNavigator && 'serial' in currentNavigator
}

export function isLikelyMobileDevice(options = {}) {
  const currentNavigator = resolveNavigator(options.navigator)
  const userAgentData = currentNavigator?.userAgentData

  if (userAgentData?.mobile)
    return true

  const userAgent = options.userAgent ?? currentNavigator?.userAgent ?? ''

  if (MOBILE_USER_AGENT_PATTERN.test(userAgent))
    return true

  const platform = options.platform ?? currentNavigator?.platform ?? ''
  const maxTouchPoints = options.maxTouchPoints ?? currentNavigator?.maxTouchPoints ?? 0

  return platform === 'MacIntel' && maxTouchPoints > 1
}

export function isSerialSecureContext(options = {}) {
  const currentWindow = resolveWindow(options.window)

  if (typeof currentWindow?.isSecureContext === 'boolean')
    return currentWindow.isSecureContext

  const currentLocation = options.location ?? currentWindow?.location
  const protocol = currentLocation?.protocol
  const hostname = currentLocation?.hostname

  return protocol === 'https:' || TRUSTED_LOCAL_HOSTS.has(hostname)
}

export function getSerialBrowserSupportStatus(options = {}) {
  const isMobile = isLikelyMobileDevice(options)
  const isSecureContext = isSerialSecureContext(options)
  const webSerialSupported = hasWebSerial(options)

  let reason = null

  if (isMobile) {
    reason = SERIAL_BROWSER_SUPPORT_REASONS.MOBILE
  }
  else if (!isSecureContext) {
    reason = SERIAL_BROWSER_SUPPORT_REASONS.INSECURE_CONTEXT
  }
  else if (!webSerialSupported) {
    reason = SERIAL_BROWSER_SUPPORT_REASONS.UNSUPPORTED_BROWSER
  }

  const blocked = !!reason

  return {
    supported: !blocked,
    blocked,
    reason,
    isMobile,
    hasWebSerial: webSerialSupported,
    isSecureContext,
  }
}
