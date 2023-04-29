<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSettingStore } from "@/store/useSettingStore";
import {
  hexFormatToHexStr,
  hexFormatToStr,
  hexStrToBuffer,
  hexStrToHexFormat,
  isHexStr,
  strToBuffer,
  strToHexFormat,
} from "@/utils/bufferConvert";
import { useFocus } from "@vueuse/core";
import { inject, ref, watch } from "vue";
import AutoSendButton from "./components/AutoSendButton.vue";

const { sendHex: serialSendHex } = inject("serial");
const { sendHex: bleSendHex } = inject("ble");
const { records, addRecord } = useRecordStore();
const { lineEnding, deviceType } = useSettingStore();
const { sendType } = useSerialStore();

const sendData = ref("");
const inputRef = ref();
const { focused } = useFocus(inputRef);

async function sendHex(data) {
  if (deviceType.value == "serial") {
    await serialSendHex(data);
  } else {
    await bleSendHex(data);
  }
}

async function send() {
  if (sendType.value == "hex") {
    const data = hexStrToBuffer(hexFormatToHexStr(sendData.value));
    await sendHex(data);
    addRecord({
      type: "write",
      data: data,
      time: new Date(),
      display: sendType.value,
    });
  } else {
    const data = strToBuffer(sendData.value + lineEnding.value);
    await sendHex(data);
    addRecord({
      type: "write",
      data: data,
      time: new Date(),
      display: sendType.value,
    });
  }
}

function onInput() {
  if (sendType.value == "hex") {
    sendData.value = hexStrToHexFormat(sendData.value);
  }
}

watch(sendType, (value) => {
  if (!sendData.value) return;
  if (value == "hex") {
    // 如果是纯hex字符,就直接转换为hex格式
    if (isHexStr(sendData.value)) {
      sendData.value = hexStrToHexFormat(sendData.value);
    } else {
      // 否则作为普通字符串,先取GBK编码,然后转换为hex格式
      sendData.value = strToHexFormat(sendData.value);
    }
  } else {
    sendData.value = hexFormatToStr(sendData.value);
  }
});
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
    <AutoSendButton class="absolute right-36 bottom-3" @send="send" />
    <button class="btn absolute right-3 bottom-3 px-10" @click="send">
      发 送
    </button>
  </div>
</template>
