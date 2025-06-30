<script setup>
import { reactiveOmit } from "@vueuse/core";
import { ToggleGroupRoot, useForwardPropsEmits } from "reka-ui";
import { provide } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  rovingFocus: { type: Boolean, required: false },
  disabled: { type: Boolean, required: false },
  orientation: { type: String, required: false },
  dir: { type: String, required: false },
  loop: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  name: { type: String, required: false },
  required: { type: Boolean, required: false },
  type: { type: String, required: false },
  modelValue: { type: null, required: false },
  defaultValue: { type: null, required: false },
  class: { type: null, required: false },
  variant: { type: null, required: false },
  size: { type: null, required: false },
});
const emits = defineEmits(["update:modelValue"]);

provide("toggleGroup", {
  variant: props.variant,
  size: props.size,
});

const delegatedProps = reactiveOmit(props, "class", "size", "variant");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ToggleGroupRoot
    v-slot="slotProps"
    data-slot="toggle-group"
    :data-size="size"
    :data-variant="variant"
    v-bind="forwarded"
    :class="
      cn(
        'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
        props.class,
      )
    "
  >
    <slot v-bind="slotProps" />
  </ToggleGroupRoot>
</template>
