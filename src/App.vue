<script setup>
import { useDark } from '@vueuse/core'
import { useSerialDataFont } from '@/composables/useSerialDataFont'

useDark()
useSerialDataFont()
</script>

<template>
  <!-- 接入路由原有逻辑移动到@/pages/index.vue -->
  <router-view />
</template>
