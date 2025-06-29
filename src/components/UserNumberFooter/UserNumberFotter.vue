<script setup>
import useOnline from './useOnline'

const { online } = useOnline()
</script>

<template>
  <div class="text-sm text-gray-500">
    当前有{{ online.serial }}位小伙伴正在与你一同调试串口~
  </div>
</template>
