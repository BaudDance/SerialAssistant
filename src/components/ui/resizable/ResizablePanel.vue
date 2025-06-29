<script setup>
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
</script>

<template>
  <SplitterPanel data-slot="resizable-panel" v-bind="forwarded">
    <slot />
  </SplitterPanel>
</template>
