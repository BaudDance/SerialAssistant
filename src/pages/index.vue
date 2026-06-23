<script setup>
import { onMounted, ref } from 'vue'
import BrowserSupportGuide from '@/components/BrowserSupportGuide.vue'
import SerialWorkspace from '@/components/SerialWorkspace.vue'
import { getSerialBrowserSupportStatus, SERIAL_BROWSER_SUPPORT_REASONS } from '@/utils/browserSupport'

defineOptions({
  name: '主页',
})

const RETRY_TIMES = 3
const RETRY_DELAY = 160

const checking = ref(true)
const supportStatus = ref(null)

function wait(ms) {
  return new Promise(resolve => globalThis.setTimeout(resolve, ms))
}

function waitForNextFrame() {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function')
    return Promise.resolve()

  return new Promise(resolve => window.requestAnimationFrame(() => resolve()))
}

function shouldRetryUnsupportedStatus(status) {
  return status.reason === SERIAL_BROWSER_SUPPORT_REASONS.UNSUPPORTED_BROWSER
    && !status.isMobile
    && status.isSecureContext
}

async function detectSupport() {
  checking.value = true
  await waitForNextFrame()

  let nextStatus = getSerialBrowserSupportStatus()

  for (let index = 0; shouldRetryUnsupportedStatus(nextStatus) && index < RETRY_TIMES; index += 1) {
    await wait(RETRY_DELAY)
    nextStatus = getSerialBrowserSupportStatus()
  }

  supportStatus.value = nextStatus
  checking.value = false
}

onMounted(() => {
  detectSupport()
})
</script>

<template>
  <SerialWorkspace v-if="supportStatus?.supported" />
  <BrowserSupportGuide
    v-else-if="!checking && supportStatus"
    :status="supportStatus"
    @retry="detectSupport"
  />
  <main v-else class="min-h-svh bg-background text-foreground flex items-center justify-center px-4">
    <section class="w-full max-w-xs text-center">
      <img src="/serial.svg" alt="" class="mx-auto size-10" aria-hidden="true">
      <h1 class="mt-4 text-xl font-semibold tracking-normal">
        启动中
      </h1>
      <div class="mx-auto mt-5 size-5 animate-spin rounded-full border-2 border-muted border-t-foreground" aria-hidden="true" />
    </section>
  </main>
</template>
