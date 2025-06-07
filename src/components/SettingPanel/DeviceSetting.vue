<script setup>
import { useSettingStore } from "@/store/useSettingStore.js";
import BleSetting from "./components/DeviceSetting/BleSetting.vue";
import SerialSetting from "./components/DeviceSetting/SerialSetting.vue";
const { deviceType } = useSettingStore();
</script>
<template>
  <SerialSetting v-if="deviceType === 'serial'" />
  <BleSetting v-else />
</template>
