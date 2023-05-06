<script setup>
import { useSettingStore } from "@/store/useSettingStore";
import { nextTick, ref, watch } from "vue";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
const { sendHexInputMode } = useSettingStore();

const groups = ref(
  props.modelValue.length == 0
    ? [""]
    : props.modelValue.replaceAll(" ", "").match(/.{1,2}/g)
);
const items = ref([]);
watch(
  [sendHexInputMode],
  () => {
    if (sendHexInputMode.value == "format") return;
    groups.value =
      props.modelValue.length == 0
        ? [""]
        : props.modelValue.replaceAll(" ", "").match(/.{1,2}/g);
  },
  { deep: true }
);
watch(
  groups,
  (n) => {
    // 不足两位的前面补0
    const data = groups.value
      .map((v) => v.padStart(2, "0"))
      .join("")
      .replace(/(.{2})/g, "$1 ")
      .trim();
    emit("update:modelValue", data);
    if (n.length == 0) {
      groups.value = [""];
    }
  },
  { deep: true }
);
async function onInput(index, e) {
  const v = e.target.value.replace(/([^0-9a-fA-F])/, "").toUpperCase();
  e.target.value = v;
  if (v.length == 0 && index > 0) {
    groups.value.splice(index, 1);
    await nextTick();
    items.value[index - 1].getElementsByTagName("input")[0].focus();
  } else if (v.length <= 2) {
    groups.value[index] = v;
  } else if (v.length > 2) {
    // 每两个字符为一组,加入groups,然后坐标移到下一个input
    groups.value[index] = v.slice(0, 2);
    for (let i = 2; i < v.length; i += 2) {
      groups.value.splice(index + i / 2, 0, v.slice(i, i + 2));
    }
    await nextTick();
    items.value[index + Math.ceil(v.length / 2) - 1]
      .getElementsByTagName("input")[0]
      .focus();
  }
}
async function onBlur(index, e) {
  const v = e.target.value;
  if (v.length == 0 && groups.value.length > 1) {
    groups.value.splice(index, 1);
  }
}
async function onDeleteDown(index, e) {
  const v = e.target.value;
  if (
    (e.key === "Backspace" || e.key === "Delete") &&
    v.length == 0 &&
    index > 0
  ) {
    groups.value.splice(index, 1);
    await nextTick();
    items.value[index - 1].getElementsByTagName("input")[0].focus();
  }
}
</script>
<template>
  <div class="flex flex-wrap gap-y-1 content-start">
    <span v-for="(g, i) in groups" ref="items">
      <label>0x</label>
      <input
        :id="'hexinput' + i"
        :ref="'hex' + i"
        :value="g"
        :key="i"
        class="w-6 bg-transparent"
        autocomplete="off"
        @input="(e) => onInput(i, e)"
        @blur="(e) => onBlur(i, e)"
      />
      <span v-if="i != groups.length - 1">,&nbsp;</span>
    </span>
  </div>
</template>
