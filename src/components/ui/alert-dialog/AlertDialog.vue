<script setup>
import { AlertDialogRoot, useForwardPropsEmits } from "reka-ui";

const props = defineProps({
  open: { type: Boolean, required: false },
  defaultOpen: { type: Boolean, required: false },
});
const emits = defineEmits(["update:open"]);

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AlertDialogRoot data-slot="alert-dialog" v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>
