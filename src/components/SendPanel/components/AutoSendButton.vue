<script setup>
import { useElementHover } from "@vueuse/core";
import { computed, ref } from "vue";
const el = ref();
const isHovered = useElementHover(el);

const emit = defineEmits(["send"]);

const autoSendTime = ref(1000);
const isAutoSending = ref(false);

let timer = undefined;

const content = computed(() => {
  if (isAutoSending.value) {
    if (isHovered.value) {
      return "取消自动发送";
    }
    return "自动发送中";
  } else {
    if (isHovered.value && autoSendTime.value) {
      return "开始自动发送";
    }
    return "自动发送";
  }
});

async function timeoutFunc() {
  if (isAutoSending.value) {
    emit("send");
    if (autoSendTime.value <= 0) return;
    timer = setTimeout(timeoutFunc, autoSendTime.value);
  }
}

async function toggleAutoSend() {
  if (isAutoSending.value) {
    isAutoSending.value = false;
    clearTimeout(timer);
  } else {
    if (autoSendTime.value <= 0) return;
    isAutoSending.value = true;
    emit("send");
    timer = setTimeout(timeoutFunc, autoSendTime.value);
  }
}
</script>

<template>
  <div class="dropdown dropdown-top dropdown-end dropdown-hover" ref="el">
    <button
      tabindex="0"
      class="btn px-7"
      :class="isAutoSending ? 'btn-success hover:btn-error' : 'btn-ghost'"
      @click="toggleAutoSend"
    >
      {{ content }}
    </button>
    <ul
      tabindex="0"
      class="dropdown-content p-3 shadow bg-base-200 rounded-box w-50"
    >
      <!-- 填写自动发送时间 与开始按钮 -->
      <div class="flex items-center">
        <input
          type="number"
          placeholder="输入间隔时长"
          class="input input-bordered input-sm w-28 flex-auto"
          v-model="autoSendTime"
        />
        <div class="w-5"></div>
        <div class="text-sm flex-none">ms/次</div>
      </div>
    </ul>
  </div>
</template>
