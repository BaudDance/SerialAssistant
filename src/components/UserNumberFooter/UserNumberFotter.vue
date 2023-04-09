<script setup>
import { useLocalStorage, useWebSocket } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";
import { computed, watch } from "vue";

// const uuid = ref(uuidv4());
const uuid = useLocalStorage("uuid", uuidv4());
const backend = "ws://serial_backend.keysking.com/wss";
const { status, data, send } = useWebSocket(backend, {
  heartbeat: {
    message: JSON.stringify({ type: "beat", uuid: uuid.value }),
    interval: 1000,
  },
});
const userNumber = computed(() => {
  const message = JSON.parse(data.value);
  return message?.number || 0;
});
watch(data, (d) => {
  console.log("data", d);
});
</script>

<template>
  <div class="text-sm text-gray-500">
    当前有{{ userNumber }}位小伙伴正在与你一同调试串口哦~
  </div>
</template>
