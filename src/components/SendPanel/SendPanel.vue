<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSettingStore } from "@/store/useSettingStore";

import { useCheckDigit } from "@/utils/useCheckDigit/useCheckDigit";
import { useDataCode } from "@/utils/useDataCode/useDataCode";
import { computed, inject, ref, watch } from "vue";
import AutoSendButton from "./components/AutoSendButton.vue";
import HexShower from "./components/HexShower.vue";

const { sendHex: serialSendHex } = inject("serial");
const { sendHex: bleSendHex } = inject("ble");
const { records, addRecord } = useRecordStore();
const { lineEnding, deviceType, sendHexInputMode } = useSettingStore();
const { sendType } = useSerialStore();
const { checkAlgorithm, checkAlgorithms } = useCheckDigit();
const {
  dataCode,
  hexStringToHexFormat,
  hexStringToBuffer,
  stringToBuffer,
  stringToHexFormat,
  stringToHexString,
  isHexString,
  bufferToHexFormat,
} = useDataCode();

const sendData = ref("");

const sendBuffer = computed(() => {
  if (sendType.value == "hex") {
    if (checkDigit.value) {
      return Uint8Array.from([
        ...hexStringToBuffer(sendData.value),
        ...checkDigit.value,
      ]);
    }
    return Uint8Array.from([...hexStringToBuffer(sendData.value)]);
  } else {
    return stringToBuffer(sendData.value + lineEnding.value);
  }
});

const checkDigit = computed(() => {
  if (!checkAlgorithm.value || sendType.value != "hex") return undefined;
  return checkAlgorithm.value.algorithm(hexStringToBuffer(sendData.value));
});

const checkDigitHexFormat = computed(() => {
  if (!checkAlgorithm.value) return undefined;
  return bufferToHexFormat(checkDigit.value);
});

async function sendHex(data) {
  if (deviceType.value == "serial") {
    await serialSendHex(data);
  } else {
    await bleSendHex(data);
  }
}

async function send() {
  await sendHex(sendBuffer.value);
  addRecord({
    type: "write",
    data: sendBuffer.value,
    time: new Date(),
    display: sendType.value,
  });
}
watch(sendType, (value) => {
  if (!sendData.value) return;
  if (value == "hex") {
    // 若为普通字符串,先取编码,然后转换为hex格式
    if (!isHexString(sendData.value)) {
      sendData.value = stringToHexString(sendData.value);
    }
  }
});

function onInput() {
  if (sendType.value == "hex") {
    sendData.value = sendData.value.replace(/([^0-9a-fA-F])/, "").toUpperCase();
  }
}

function clear() {
  sendData.value = "";
}
</script>

<template>
  <div class="relative">
    <HexShower
      v-if="sendHexInputMode == 'format' && sendType == 'hex'"
      v-model="sendData"
      class="w-full h-full rounded-xl px-3 bg-transparent pb-10"
    />
    <textarea
      id="send-panel-input"
      type="text-area"
      v-else
      class="w-full h-full rounded-xl px-3 bg-transparent pb-10 pr-40"
      autocomplete="send-panel-input"
      @input="onInput"
      v-model="sendData"
    ></textarea>
    <div class="absolute right-3 bottom-3 flex gap-x-3">
      <div class="dropdown dropdown-top" v-if="sendType == 'hex'">
        <label
          tabindex="0"
          class="btn"
          :class="checkAlgorithm ? 'btn-success btn-outline' : 'btn-ghost'"
        >
          {{
            checkAlgorithm
              ? `${checkAlgorithm.name}(${checkDigitHexFormat})`
              : "校验位"
          }}
        </label>
        <ul
          tabindex="0"
          class="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-28"
        >
          <li v-for="item in checkAlgorithms">
            <a @click="checkAlgorithm = item">{{ item.name }}</a>
          </li>
          <li>
            <a @click="checkAlgorithm = undefined">不校验</a>
          </li>
        </ul>
      </div>
      <AutoSendButton class="" @send="send" />
      <button class="btn px-10" @click="send">发 送</button>
    </div>
    <button
      class="absolute right-1 top-1 btn btn-ghost btn-circle btn-sm"
      @click="clear"
    >
      <img class="w-5 h-5" src="/clear_context.svg" />
    </button>
  </div>
</template>
