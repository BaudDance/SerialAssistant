<script setup>
import { inject } from "vue";
import SelectPort from "./components/SelectPort.vue";
import SettingPanel from "./components/SettingPort.vue";
const { port, portName } = inject("serial");
</script>

<template>
  <SettingPanel v-if="port"></SettingPanel>
  <SelectPort v-else></SelectPort>
</template>
