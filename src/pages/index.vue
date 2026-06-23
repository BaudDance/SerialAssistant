<script setup>
import { ref } from 'vue'
import BrowserSupportGuide from '@/components/BrowserSupportGuide.vue'
import SerialWorkspace from '@/components/SerialWorkspace.vue'
import { getSerialBrowserSupportStatus } from '@/utils/browserSupport'

defineOptions({
  name: '主页',
})

const supportStatus = ref(getSerialBrowserSupportStatus())

function refreshSupportStatus() {
  supportStatus.value = getSerialBrowserSupportStatus()
}
</script>

<template>
  <SerialWorkspace v-if="supportStatus.supported" />
  <BrowserSupportGuide v-else :status="supportStatus" @retry="refreshSupportStatus" />
</template>
