<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { hex2ArrayBuffer } from "@/utils/displayConvert";
import { useFocus } from "@vueuse/core";
import { inject, ref } from "vue";
import { useSerialStore } from "../../store/useSerialStore";

const { sendHex } = inject("serial");
const { records } = useRecordStore();
const { sendType } = useSerialStore();

const sendData = ref("");
const inputRef = ref();
const { focused } = useFocus(inputRef);

async function send() {
  if (sendType.value == "hex") {
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
  </div>
</template>
