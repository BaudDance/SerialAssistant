<script setup>
import BottomBar from "./components/BottomBar.vue";
import SerialSetting from "./components/DeviceSetting/DeviceSetting.vue";
</script>

<template>
  <div class="flex flex-col">
    <SerialSetting />
    <div class="flex-1"></div>
    <BottomBar />
  </div>
</template>
