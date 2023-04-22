<script setup>
import { useSettingStore } from "@/store/useSettingStore";

const { lineEnding } = useSettingStore();
</script>
<template>
  <input type="checkbox" id="setting-modal" class="modal-toggle" />
  <label for="setting-modal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <h3 class="text-lg font-bold mb-8">波特律动串口助手 设置</h3>
      <div class="flex items-center gap-x-5">
        <span class="text-white">行尾自动添加:</span>
        <select
          v-model="lineEnding"
          class="select select-bordered w-full max-w-xs"
        >
          <option value="">无</option>
          <option :value="'\n'">LF</option>
          <option :value="'\r'">CR</option>
          <option :value="'\r\n'">CRLF</option>
        </select>
      </div>
    </label>
  </label>
</template>
