<script setup>
import { inject, watch } from "vue";
import SelectPort from "./components/SelectPort.vue";
import SettingPanel from "./components/SettingPort.vue";
const { port, portName } = inject("serial");
console.log("port", port);
watch(portName, (p, p2) => {
  console.log("port changed", p);
});
</script>

<template>
  <SettingPanel v-if="port"></SettingPanel>
  <SelectPort v-else></SelectPort>
</template>
