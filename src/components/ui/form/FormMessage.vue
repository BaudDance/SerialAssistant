<script setup>
import { ErrorMessage } from "vee-validate";
import { toValue } from "vue";
import { cn } from "@/lib/utils";
import { useFormField } from "./useFormField";

const props = defineProps({
  class: { type: null, required: false },
});

const { name, formMessageId } = useFormField();
</script>

<template>
  <ErrorMessage
    :id="formMessageId"
    data-slot="form-message"
    as="p"
    :name="toValue(name)"
    :class="cn('text-destructive-foreground text-sm', props.class)"
  />
</template>
