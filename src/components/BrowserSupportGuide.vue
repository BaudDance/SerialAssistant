<script setup>
import { Clipboard, ExternalLink, MonitorCheck, RefreshCw, Smartphone, Usb } from 'lucide-vue-next'
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

const locationInfo = computed(() => props.status.location ?? {})

const currentUrl = computed(() => {
  if (locationInfo.value.href)
    return locationInfo.value.href

  if (typeof window === 'undefined')
    return ''

  return window.location.href
})

const recommendedUrl = computed(() => locationInfo.value.recommendedHttpsUrl ?? '')

const actionUrl = computed(() => recommendedUrl.value || currentUrl.value)

const urlLabel = computed(() => recommendedUrl.value ? '建议访问地址' : '当前网址')

const displayOrigin = computed(() => {
  const { protocol, host, hostname } = locationInfo.value

  if (protocol && (host || hostname))
    return `${protocol}//${host || hostname}`

  return currentUrl.value || '未知地址'
})

const copyButtonText = computed(() => {
  if (copyState.value === 'copied')
    return recommendedUrl.value ? '已复制 HTTPS 地址' : '已复制网址'

  if (copyState.value === 'failed')
    return '复制失败'

  if (copyState.value === 'copying')
    return '正在复制...'

  return recommendedUrl.value ? '复制 HTTPS 地址' : '复制当前网址'
})

const reasonContent = computed(() => {
  switch (props.status.reason) {
    case SERIAL_BROWSER_SUPPORT_REASONS.MOBILE:
      return {
        icon: Smartphone,
        title: '手机暂时不能连接串口',
        description: 'Web Serial 主要支持桌面版 Chromium 浏览器。请把当前网址复制到 Windows、macOS 或 Linux 上的 Chrome / Edge 打开。',
      }
    case SERIAL_BROWSER_SUPPORT_REASONS.INSECURE_CONTEXT:
      return {
        icon: MonitorCheck,
        title: '当前网址不是安全上下文',
        description: locationInfo.value.protocol === 'http:'
          ? `Web Serial 只能在 HTTPS 或 localhost 这类可信地址下使用。当前访问地址是 ${displayOrigin.value}，请给线上站点配置 HTTPS 后再访问。`
          : '浏览器认为当前页面不是安全上下文，Web Serial 因此被隐藏。请确认线上站点使用有效 HTTPS 证书访问。',
      }
    case SERIAL_BROWSER_SUPPORT_REASONS.UNSUPPORTED_BROWSER:
      return {
        icon: Usb,
        title: '当前浏览器没有开放 Web Serial',
        description: '请使用桌面版 Chrome 或 Edge，并确认地址栏是 HTTPS。若页面被嵌入到其他站点，还需要外层页面允许 serial 权限。',
      }
    default:
      return {
        icon: MonitorCheck,
        title: '暂时无法连接串口',
        description: '请使用桌面版 Chrome 或 Edge，并通过 HTTPS 或 localhost 访问当前页面。',
      }
  }
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
    const copied = await copyText(actionUrl.value)
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

function openRecommendedUrl() {
  if (!recommendedUrl.value || typeof window === 'undefined')
    return

  window.location.assign(recommendedUrl.value)
}
</script>

<template>
  <main class="min-h-svh bg-background text-foreground flex items-center justify-center px-4 py-8">
    <section class="w-full max-w-2xl">
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

      <div class="mt-8 rounded-lg border bg-card p-5 shadow-sm" role="alert" aria-live="polite">
        <component :is="reasonContent.icon" class="mb-3 size-5 text-foreground" />
        <h2 class="text-xl font-semibold tracking-normal">
          {{ reasonContent.title }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ reasonContent.description }}
        </p>
      </div>

      <div class="mt-5 rounded-lg border bg-muted/40 p-4">
        <p class="text-sm font-medium">
          {{ urlLabel }}
        </p>
        <p class="break-all rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {{ actionUrl }}
        </p>
        <p v-if="recommendedUrl" class="mt-2 text-xs leading-5 text-muted-foreground">
          如果这个 HTTPS 地址仍无法打开，说明部署侧还没有完成域名证书或反向代理 TLS 配置。
        </p>
      </div>

      <dl class="mt-4 grid gap-2 sm:grid-cols-3">
        <div class="rounded-md border px-3 py-2">
          <dt class="text-xs text-muted-foreground">
            协议
          </dt>
          <dd class="mt-1 text-sm font-medium">
            {{ locationInfo.protocol || '未知' }}
          </dd>
        </div>
        <div class="rounded-md border px-3 py-2">
          <dt class="text-xs text-muted-foreground">
            安全上下文
          </dt>
          <dd class="mt-1 text-sm font-medium">
            {{ status.isSecureContext ? '是' : '否' }}
          </dd>
        </div>
        <div class="rounded-md border px-3 py-2">
          <dt class="text-xs text-muted-foreground">
            Web Serial
          </dt>
          <dd class="mt-1 text-sm font-medium">
            {{ status.hasWebSerial ? '已开放' : '未开放' }}
          </dd>
        </div>
      </dl>

      <div class="mt-6 grid gap-2" :class="recommendedUrl ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
        <Button class="cursor-pointer" @click="copyCurrentUrl">
          <Clipboard class="size-4" />
          {{ copyButtonText }}
        </Button>
        <Button v-if="recommendedUrl" class="cursor-pointer" variant="outline" @click="openRecommendedUrl">
          <ExternalLink class="size-4" />
          打开 HTTPS 地址
        </Button>
        <Button class="cursor-pointer" variant="outline" @click="retry">
          <RefreshCw class="size-4" />
          重新检测
        </Button>
      </div>
    </section>
  </main>
</template>
