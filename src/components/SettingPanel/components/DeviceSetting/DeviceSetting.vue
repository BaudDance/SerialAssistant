<script setup>
import { useSettingStore } from "@/store/useSettingStore";
import BleSetting from "./BleSetting.vue";
import SerialSetting from "./SerialSetting.vue";
const { deviceType } = useSettingStore();
</script>
<template>
  <SerialSetting v-if="deviceType == 'serial'" />
  <BleSetting v-else />
</template>
