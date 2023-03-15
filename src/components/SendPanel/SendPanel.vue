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

// 将字符串分为两个字符一组，然后转换为16进制
function splitString(str) {
  const result = [];
  for (let i = 0; i < str.length; i += 2) {
    result.push("0x" + str.slice(i, i + 2));
  }
  return result;
}
function onInput() {
  if (sendType.value == "hex") {
    const value = sendData.value.replaceAll(", ", "").replaceAll("0x", "");
    const result = splitString(value);
    sendData.value = result.join(", ");
  }
}
</script>

<template>
  <div class="relative">
    <textarea
      id="send-panel-input"
      ref="inputRef"
      type="text-area"
      class="w-full h-full rounded-xl px-3 bg-transparent pb-10"
      autocomplete="send-panel-input"
      @input="onInput"
      v-model="sendData"
    ></textarea>

    <button class="btn absolute right-3 bottom-3 px-10" @click="send">
      发 送
    </button>
  </div>
</template>
