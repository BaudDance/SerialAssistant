<script setup>
import { Eye, File, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { createFileMeta, formatFileSize } from '@/utils/filePayload'

const props = defineProps({
  payload: {
    type: Object,
    required: true,
  },
  removable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['view', 'remove'])

const meta = computed(() => createFileMeta(
  props.payload.fileMeta || props.payload,
  props.payload.byteLength || props.payload.data?.byteLength || props.payload.size || 0,
))

const progressWidth = computed(() => `${Math.min(100, Math.max(0, props.progress))}%`)
</script>

<template>
  <div class="relative overflow-hidden rounded-md border bg-background text-foreground shadow-xs">
    <div
      v-if="progress > 0 && progress < 100"
      class="absolute inset-y-0 left-0 bg-primary/10 transition-[width]"
      :style="{ width: progressWidth }"
    />
    <div class="relative flex min-w-0 items-center gap-3 p-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
        <File class="h-5 w-5 text-muted-foreground" />
      </div>

      <button
        type="button"
        class="min-w-0 flex-1 text-left"
        :disabled="disabled"
        @click="emit('view')"
      >
        <div class="truncate text-sm font-medium">
          {{ meta.name }}
        </div>
        <div class="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span>{{ formatFileSize(meta.size) }}</span>
          <span v-if="meta.type" class="truncate">{{ meta.type }}</span>
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 cursor-pointer"
        :disabled="disabled"
        @click="emit('view')"
      >
        <Eye class="h-4 w-4" />
      </Button>

      <Button
        v-if="removable"
        variant="ghost"
        size="icon"
        class="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
        :disabled="disabled"
        @click="emit('remove')"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
