import { describe, expect, it } from 'vitest'
import {
  getSerialBrowserSupportStatus,
  getSerialLocationInfo,
  hasWebSerial,
  isLikelyMobileDevice,
  SERIAL_BROWSER_SUPPORT_REASONS,
} from '../src/utils/browserSupport'

function createNavigator({
  serial = true,
  userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
  platform = 'Win32',
  maxTouchPoints = 0,
  userAgentData,
} = {}) {
  const mockNavigator = {
    userAgent,
    platform,
    maxTouchPoints,
  }

  if (serial)
    mockNavigator.serial = {}

  if (userAgentData)
    mockNavigator.userAgentData = userAgentData

  return mockNavigator
}

function createWindow({
  isSecureContext = true,
  protocol = 'https:',
  hostname = 'serial.baud-dance.com',
  host = hostname,
  href = `${protocol}//${host}/`,
  pathname = '/',
  search = '',
  hash = '',
} = {}) {
  return {
    isSecureContext,
    location: {
      protocol,
      hostname,
      host,
      href,
      pathname,
      search,
      hash,
    },
  }
}

describe('browser support detection', () => {
  it('allows desktop secure browsers with Web Serial support', () => {
    const status = getSerialBrowserSupportStatus({
      navigator: createNavigator(),
      window: createWindow(),
    })

    expect(status).toEqual(expect.objectContaining({
      supported: true,
      blocked: false,
      reason: null,
      isMobile: false,
      hasWebSerial: true,
      isSecureContext: true,
    }))
  })

  it('blocks unsupported desktop browsers that do not expose navigator.serial', () => {
    const status = getSerialBrowserSupportStatus({
      navigator: createNavigator({ serial: false }),
      window: createWindow(),
    })

    expect(status).toEqual(expect.objectContaining({
      supported: false,
      blocked: true,
      reason: SERIAL_BROWSER_SUPPORT_REASONS.UNSUPPORTED_BROWSER,
      isMobile: false,
      hasWebSerial: false,
      isSecureContext: true,
    }))
  })

  it('blocks non-secure contexts before checking browser support', () => {
    const status = getSerialBrowserSupportStatus({
      navigator: createNavigator(),
      window: createWindow({ isSecureContext: false, protocol: 'http:', hostname: 'example.com' }),
    })

    expect(status).toEqual(expect.objectContaining({
      supported: false,
      blocked: true,
      reason: SERIAL_BROWSER_SUPPORT_REASONS.INSECURE_CONTEXT,
      isMobile: false,
      hasWebSerial: true,
      isSecureContext: false,
    }))
  })

  it('blocks mobile devices even when Web Serial is present', () => {
    const status = getSerialBrowserSupportStatus({
      navigator: createNavigator({
        userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
        platform: 'Linux armv8l',
      }),
      window: createWindow(),
    })

    expect(status).toEqual(expect.objectContaining({
      supported: false,
      blocked: true,
      reason: SERIAL_BROWSER_SUPPORT_REASONS.MOBILE,
      isMobile: true,
      hasWebSerial: true,
      isSecureContext: true,
    }))
  })

  it('treats localhost as a trusted development context when isSecureContext is unavailable', () => {
    const status = getSerialBrowserSupportStatus({
      navigator: createNavigator(),
      window: {
        location: {
          protocol: 'http:',
          hostname: 'localhost',
        },
      },
    })

    expect(status.supported).toBe(true)
    expect(status.isSecureContext).toBe(true)
  })

  it('recommends https for deployed http URLs', () => {
    const location = getSerialLocationInfo({
      window: createWindow({
        isSecureContext: false,
        protocol: 'http:',
        hostname: 'serial.example.com',
        host: 'serial.example.com:8080',
        href: 'http://serial.example.com:8080/tools?tab=serial#connect',
        pathname: '/tools',
        search: '?tab=serial',
        hash: '#connect',
      }),
    })

    expect(location).toEqual(expect.objectContaining({
      protocol: 'http:',
      hostname: 'serial.example.com',
      host: 'serial.example.com:8080',
      isTrustedLocalHost: false,
      recommendedHttpsUrl: 'https://serial.example.com:8080/tools?tab=serial#connect',
    }))
  })

  it('detects iPadOS desktop-style user agents as mobile by touch-capable Mac platform', () => {
    expect(isLikelyMobileDevice({
      navigator: createNavigator({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    })).toBe(true)
  })

  it('checks Web Serial without touching global navigator when a navigator is passed in', () => {
    expect(hasWebSerial({ navigator: createNavigator() })).toBe(true)
    expect(hasWebSerial({ navigator: createNavigator({ serial: false }) })).toBe(false)
  })
})
