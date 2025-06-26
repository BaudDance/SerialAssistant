<script setup>
import Menu from './Menu.vue'
</script>

<template>
  <div>
    <div class="flex gap-x-2">
      <Menu />
      <div class="flex-1" />
      <a href="https://github.com/BaudDance/SerialAssistant" target="_blank">
        <label class="btn btn-square btn-ghost">
          <img src="/github.svg" class="w-7 h-7">
        </label>
      </a>
      <a href="https://space.bilibili.com/6100925" target="_blank">
        <label class="btn btn-square btn-ghost">
          <img src="/bilibili.svg" class="w-7 h-7">
        </label>
      </a>
    </div>
  </div>
</template>
