<script setup>
import { Clipboard, MonitorCheck, RefreshCw, Smartphone, Usb } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { SERIAL_BROWSER_SUPPORT_REASONS } from '@/utils/browserSupport'

const props = defineProps({
  status: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['retry'])

const copyState = ref('idle')

const reasonContent = computed(() => {
  switch (props.status.reason) {
    case SERIAL_BROWSER_SUPPORT_REASONS.MOBILE:
      return {
        icon: Smartphone,
        title: '手机暂时不能连接串口',
        description: '请把当前网址复制到电脑上，用 Chrome 或 Edge 打开。',
      }
    case SERIAL_BROWSER_SUPPORT_REASONS.INSECURE_CONTEXT:
      return {
        icon: MonitorCheck,
        title: '当前网址无法连接串口',
        description: '请复制当前网址，在电脑上的 Chrome 或 Edge 中打开。',
      }
    case SERIAL_BROWSER_SUPPORT_REASONS.UNSUPPORTED_BROWSER:
      return {
        icon: Usb,
        title: '当前浏览器无法连接串口',
        description: '请复制当前网址，在电脑上的 Chrome 或 Edge 中打开。',
      }
    default:
      return {
        icon: MonitorCheck,
        title: '请换到电脑浏览器打开',
        description: '请复制当前网址，在电脑上的 Chrome 或 Edge 中打开。',
      }
  }
})

const currentUrl = computed(() => {
  if (typeof window === 'undefined')
    return ''

  return window.location.href
})

async function copyText(text) {
  if (!text)
    return false

  const currentNavigator = typeof navigator === 'undefined' ? null : navigator

  if (currentNavigator?.clipboard?.writeText) {
    await currentNavigator.clipboard.writeText(text)
    return true
  }

  if (typeof document === 'undefined')
    return false

  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  return copied
}

async function copyCurrentUrl() {
  try {
    copyState.value = 'copying'
    const copied = await copyText(currentUrl.value)
    copyState.value = copied ? 'copied' : 'failed'
  }
  catch (error) {
    console.error('复制链接失败:', error)
    copyState.value = 'failed'
  }
  finally {
    globalThis.setTimeout(() => {
      copyState.value = 'idle'
    }, 1800)
  }
}

function retry() {
  emit('retry')
}
</script>

<template>
  <main class="min-h-svh bg-background text-foreground flex items-center justify-center px-4 py-8">
    <section class="w-full max-w-xl rounded-lg border bg-card text-card-foreground shadow-sm p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <img src="/serial.svg" alt="" class="size-10" aria-hidden="true">
        <div>
          <p class="text-sm text-muted-foreground">
            波特律动
          </p>
          <h1 class="text-2xl font-semibold tracking-normal">
            串口助手
          </h1>
        </div>
      </div>

      <div class="mt-8 rounded-lg border bg-background p-4" role="alert" aria-live="polite">
        <component :is="reasonContent.icon" class="mb-3 size-5 text-foreground" />
        <h2 class="text-xl font-semibold tracking-normal">
          {{ reasonContent.title }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ reasonContent.description }}
        </p>
      </div>

      <div class="mt-5 space-y-2">
        <p class="text-sm font-medium">
          当前网址
        </p>
        <p class="break-all rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {{ currentUrl }}
        </p>
      </div>

      <div class="mt-6 grid gap-2 sm:grid-cols-2">
        <Button class="cursor-pointer" @click="copyCurrentUrl">
          <Clipboard class="size-4" />
          {{ copyState === 'copied' ? '已复制网址' : copyState === 'failed' ? '复制失败' : '复制当前网址' }}
        </Button>
        <Button class="cursor-pointer" variant="outline" @click="retry">
          <RefreshCw class="size-4" />
          重新检测
        </Button>
      </div>
    </section>
  </main>
</template>
