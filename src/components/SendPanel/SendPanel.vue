<script setup>
import { useRecordStore } from "@/store/useRecordStore";
import { useSerialStore } from "@/store/useSerialStore";
import { useSettingStore } from "@/store/useSettingStore";

import { useCheckDigit } from "@/utils/useCheckDigit/useCheckDigit";
import { useDataCode } from "@/utils/useDataCode/useDataCode";
import { useEventBus } from "@vueuse/core";
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
        ...hexStringToBuffer(sendData.value.replace(" ", "")),
        ...checkDigit.value,
      ]);
    }
    return hexStringToBuffer(sendData.value.replaceAll(" ", ""));
  } else {
    return stringToBuffer(sendData.value + lineEnding.value);
  }
});

const checkDigit = computed(() => {
  if (!checkAlgorithm.value || sendType.value != "hex") return undefined;
  if (sendData.value.length == 0) return [0x00];
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
    sendData.value = sendData.value
      .replace(/([^0-9a-fA-F ])/, "")
      .toUpperCase();
    reformatHex();
  }
}

function clear() {
  sendData.value = "";
}

function switchSendHexInputMode() {
  if (sendHexInputMode.value == "format") {
    sendHexInputMode.value = "normal";
  } else {
    sendHexInputMode.value = "format";
  }
}

const reformatBus = useEventBus("reformat");

function reformat() {
  if (sendType.value == "hex") {
    reformatBus.emit("reformat");
    if (sendHexInputMode.value == "normal") {
      reformatHex();
    }
  }
}

function reformatHex() {
  let data = sendData.value;
  // 首先使用空格分割 并去掉空字符串
  data = data.split(" ").filter((item) => item);
  // 在长度为奇数的字符串的最后一位前补0
  data = data.map((item) => {
    if (item.length % 2 == 1) {
      // 最后一位前补0
      return item.slice(0, item.length - 1) + "0" + item.slice(item.length - 1);
    }
    return item;
  });
  // 将数组转换为字符串
  data = data.join("");
  // 将字符串按照每两个字符分割
  data = data.match(/.{1,2}/g);
  // 将数组转换为字符串
  data = data.join(" ");
  sendData.value = data;
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
      <button
        class="btn px-10"
        :class="sendData.length == 0 ? 'btn-disabled' : ''"
        @click="send"
      >
        发 送
      </button>
    </div>
    <div class="absolute right-1 top-1 flex flex-col gap-y-2">
      <button class="btn btn-ghost btn-circle btn-sm" @click="clear">
        <img class="w-5 h-5" src="/clear_context.svg" />
      </button>
      <button
        v-if="sendType == 'hex'"
        class="btn btn-ghost btn-circle btn-sm lowercase"
        @click="reformat"
      >
        <span class="text-xs">整理</span>
      </button>
      <button
        v-if="sendType == 'hex'"
        class="btn btn-outline btn-circle btn-sm lowercase"
        :class="sendHexInputMode == 'format' ? 'btn-active' : ''"
        @click="switchSendHexInputMode"
      >
        <span>0x</span>
      </button>
    </div>
  </div>
</template>
