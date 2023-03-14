<script setup>
import { inject } from "vue";
const { requestPort } = inject("serial");
</script>

<template>
  <div class="flex flex-col">
    <!-- TODO 显示已经添加过的port列表 （由于无法显示COM号，考虑添加自己命名的功能） -->
    <button class="btn btn-outline" @click="requestPort">添加端口</button>
  </div>
</template>
