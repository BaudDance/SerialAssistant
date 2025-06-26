<script setup>
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuItem } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps({
  value: { type: String, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <NavigationMenuItem
    data-slot="navigation-menu-item"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <slot />
  </NavigationMenuItem>
</template>
