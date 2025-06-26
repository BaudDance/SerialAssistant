<script setup>
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuRoot, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";
import NavigationMenuViewport from "./NavigationMenuViewport.vue";

const props = defineProps({
  modelValue: { type: String, required: false },
  defaultValue: { type: String, required: false },
  dir: { type: String, required: false },
  orientation: { type: String, required: false },
  delayDuration: { type: Number, required: false },
  skipDelayDuration: { type: Number, required: false },
  disableClickTrigger: { type: Boolean, required: false },
  disableHoverTrigger: { type: Boolean, required: false },
  disablePointerLeaveClose: { type: Boolean, required: false },
  unmountOnHide: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
  viewport: { type: Boolean, required: false, default: true },
});
const emits = defineEmits(["update:modelValue"]);

const delegatedProps = reactiveOmit(props, "class", "viewport");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NavigationMenuRoot
    data-slot="navigation-menu"
    :data-viewport="viewport"
    v-bind="forwarded"
    :class="
      cn(
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
        props.class,
      )
    "
  >
    <slot />
    <NavigationMenuViewport v-if="viewport" />
  </NavigationMenuRoot>
</template>
