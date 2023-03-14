<script setup>
import SettingPanel from "@/components/SettingPanel/SettingPanel.vue";
import { useSerial } from "@/utils/useSerial";
import { provide } from "vue";

const serial = useSerial();
provide("serial", serial);
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="container aspect-video flex flex-nowrap">
      <SettingPanel
        class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl p-5"
      />
      <div class="w-14"></div>
      <div class="flex flex-col flex-grow">
        <div
          class="basis-3/4 border-solid border-2 border-gray-400 rounded-3xl"
        >
          <div class="chat chat-start">
            <div class="chat-header">
              <time class="text-xs opacity-50">00:12:45 hex</time>
            </div>
            <div class="chat-bubble">
              0x01 0x03 0x00 0x00 0x00 0x01 0x84 0x0A
            </div>
          </div>
        </div>
        <div class="h-8"></div>
        <div
          class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
