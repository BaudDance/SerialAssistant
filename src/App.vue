<script setup>
import { useDark } from '@vueuse/core'

useDark()
</script>

<template>
  <!-- 接入路由原有逻辑移动到@/pages/index.vue -->
  <router-view />
</template>
