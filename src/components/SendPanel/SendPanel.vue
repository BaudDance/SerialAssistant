<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { hex2ArrayBuffer } from "@/utils/displayConvert";
import { useFocus } from "@vueuse/core";
import { inject, ref } from "vue";

const { sendHex } = inject("serial");
const { records } = useRecordStore();

const sendData = ref("");
const inputRef = ref();
const { focused } = useFocus(inputRef);
const hex = ref(true);

async function send() {
  if (hex.value) {
    const data = hex2ArrayBuffer(sendData.value);
    console.log("send", data);
    await sendHex(data);
    records.value.push({
      type: "write",
      data: data,
      time: new Date(),
      display: "hex",
    });
  } else {
    // sendHex(sendData.value);
  }
}
</script>

<template>
  <div class="relative" @click="focused = true">
    <input
      id="send-panel-input"
      ref="inputRef"
      type="text-area"
      class="w-0"
      autocomplete="send-panel-input"
      v-model="sendData"
    />
    {{ sendData }}
    <button class="btn absolute right-3 bottom-3 px-10" @click="send">
      发 送
    </button>
    <div class="tooltip absolute top-3 right-10" data-tip="点击切换发送格式">
      <label class="swap badge badge-info badge-outline text-white text-center">
        <input type="checkbox" v-model="hex" />
        <div class="swap-on fill-current w-15">HEX</div>
        <div class="swap-off fill-current w-15">ASCII</div>
      </label>
    </div>
  </div>
</template>
