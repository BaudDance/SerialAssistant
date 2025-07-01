<script setup>
import { ref } from 'vue'
import { SplitterPanel, useForwardPropsEmits } from "reka-ui";

const props = defineProps({
  collapsedSize: { type: Number, required: false },
  collapsible: { type: Boolean, required: false },
  defaultSize: { type: Number, required: false },
  id: { type: String, required: false },
  maxSize: { type: Number, required: false },
  minSize: { type: Number, required: false },
  order: { type: Number, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
const emits = defineEmits(["collapse", "expand", "resize"]);

const forwarded = useForwardPropsEmits(props, emits);

// 创建对内部 SplitterPanel 的引用
const splitterPanelRef = ref(null)

// 暴露方法和属性给父组件
defineExpose({
  // 暴露 SplitterPanel 的方法
  expand: () => splitterPanelRef.value?.expand(),
  collapse: () => splitterPanelRef.value?.collapse(),
  resize: (size) => splitterPanelRef.value?.resize(size),
  getSize: () => splitterPanelRef.value?.getSize(),
  // 暴露 SplitterPanel 的属性
  get isCollapsed() {
    return splitterPanelRef.value?.isCollapsed
  },
  get isExpanded() {
    return splitterPanelRef.value?.isExpanded
  }
})
</script>

<template>
  <SplitterPanel ref="splitterPanelRef" data-slot="resizable-panel" v-bind="forwarded">
    <slot />
  </SplitterPanel>
</template>
