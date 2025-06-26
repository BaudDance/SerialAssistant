<script setup>
import Bar from '@/components/SettingPanel/components/DeviceSetting/Bar.vue'
import { useSettingStore } from '@/store/useSettingStore.js'
import BleSetting from './components/DeviceSetting/BleSetting.vue'
import SerialSetting from './components/DeviceSetting/SerialSetting.vue'

const { deviceType } = useSettingStore()
</script>

<template>
  <div class="flex flex-col">
    <SerialSetting v-if="deviceType === 'serial'" />
    <BleSetting v-else />
    <div class="flex-1" />
    <Bar />
  </div>
</template>
