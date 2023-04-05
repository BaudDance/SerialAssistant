<script setup>
import Menu from "./Menu.vue";
</script>
<template>
  <div class="flex gap-x-2">
    <Menu></Menu>
    <div class="flex-1"></div>
    <a href="https://github.com/BaudDance/SerialAssistant" target="_blank">
      <label class="btn btn-square btn-ghost">
        <img src="/github.svg" class="w-7 h-7" />
      </label>
    </a>
    <a href="https://space.bilibili.com/6100925" target="_blank">
      <label class="btn btn-square btn-ghost">
        <img src="/bilibili.svg" class="w-7 h-7" />
      </label>
    </a>
  </div>
</template>
