<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSettingStore } from "@/store/useSettingStore";

import { useDataCode } from "@/utils/useDataCode/useDataCode";
import { computed, inject, ref } from "vue";
import AutoSendButton from "./components/AutoSendButton.vue";

const { sendHex: serialSendHex } = inject("serial");
const { sendHex: bleSendHex } = inject("ble");
const { records, addRecord } = useRecordStore();
const { lineEnding, deviceType } = useSettingStore();
const { sendType } = useSerialStore();
const {
  dataCode,
  hexStringToHexFormat,
  hexStringToBuffer,
  stringToBuffer,
  stringToHexFormat,
} = useDataCode();

const sendData = ref("1234AB2B");

const sendDataHex = computed(() => {
  if (sendType.value == "hex") {
    return hexStringToHexFormat(sendData.value);
  } else {
    return stringToHexFormat(sendData.value + lineEnding.value);
  }
});

async function sendHex(data) {
  if (deviceType.value == "serial") {
    await serialSendHex(data);
  } else {
    await bleSendHex(data);
  }
}

async function send() {
  if (sendType.value == "hex") {
    const data = hexStringToBuffer(sendData.value);
    await sendHex(data);
    addRecord({
      type: "write",
      data: data,
      time: new Date(),
      display: sendType.value,
    });
  } else {
    const data = stringToBuffer(sendData.value + lineEnding.value);
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
    sendData.value = sendData.value.replace(/([^0-9a-fA-F])/, "").toUpperCase();
  }
}
</script>

<template>
  <div class="relative">
    <textarea
      id="send-panel-input"
      type="text-area"
      class="w-full h-full rounded-xl px-3 bg-transparent pb-10"
      autocomplete="send-panel-input"
      @input="onInput"
      v-model="sendData"
    ></textarea>
    <!-- <div>{{ sendDataHex }}</div> -->
    <AutoSendButton class="absolute right-36 bottom-3" @send="send" />
    <button class="btn absolute right-3 bottom-3 px-10" @click="send">
      发 送
    </button>
  </div>
</template>
