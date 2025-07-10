<script setup>
import { defineAsyncComponent, shallowRef } from 'vue'

const modules = import.meta.glob('./**/*.vue')

const dialogComponents = shallowRef(
  Object.fromEntries(
    Object.entries(modules)
      .filter(([path]) => !path.includes('Provider.vue')) // 排除自身
      .map(([path, loader]) => [
        path.split('/').pop().split('.')[0], // 组件名
        defineAsyncComponent({ loader, delay: 200, timeout: 3000 }),
      ]),
  ),
)
</script>

<template>
  <template v-for="(dialog, _, _index) in dialogComponents" :key="_index">
    <component :is="dialog" />
  </template>
</template>
