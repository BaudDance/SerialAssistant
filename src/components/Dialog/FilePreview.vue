<script setup>
import { ChevronLeft, ChevronRight, File } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { createFileMeta, formatFileSize, toUint8Array } from '@/utils/filePayload'
import { dialogKeys, useDialog } from './composable'

const BYTES_PER_ROW = 16
const ROWS_PER_PAGE = 256
const PAGE_BYTES = BYTES_PER_ROW * ROWS_PER_PAGE

const { visible, payloads } = useDialog()
const { bufferToString } = useDataCode()
const currentPage = ref(1)

const payload = computed(() => payloads[dialogKeys.filePreview] || {})
const data = computed(() => toUint8Array(payload.value.data || payload.value.dataBuffer))
const meta = computed(() => createFileMeta(payload.value.fileMeta || payload.value, data.value.byteLength))
const totalPages = computed(() => Math.max(1, Math.ceil(data.value.byteLength / PAGE_BYTES)))
const pageStart = computed(() => (currentPage.value - 1) * PAGE_BYTES)
const pageBytes = computed(() => data.value.subarray(pageStart.value, Math.min(data.value.byteLength, pageStart.value + PAGE_BYTES)))

const rows = computed(() => {
  const result = []
  for (let offset = 0; offset < pageBytes.value.byteLength; offset += BYTES_PER_ROW) {
    const bytes = pageBytes.value.subarray(offset, offset + BYTES_PER_ROW)
    result.push({
      offset: pageStart.value + offset,
      hex: Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '),
    })
  }
  return result
})

const pageText = computed(() => {
  if (!pageBytes.value.byteLength)
    return ''

  return Array.from(bufferToString(pageBytes.value))
    .map((char) => {
      if (char === '\n' || char === '\r' || char === '\t')
        return char
      const code = char.codePointAt(0) || 0
      return code < 32 || code === 127 ? '.' : char
    })
    .join('')
})

watch(
  () => visible[dialogKeys.filePreview],
  (open) => {
    if (open)
      currentPage.value = 1
  },
)

function previousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

function nextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.filePreview]">
    <DialogContent class="flex h-[86vh] w-[96vw] max-w-none flex-col overflow-hidden sm:max-w-[96vw] xl:w-[1200px] xl:max-w-[1200px] 2xl:w-[1360px] 2xl:max-w-[1360px]">
      <DialogHeader>
        <DialogTitle class="flex min-w-0 items-center gap-2">
          <File class="h-5 w-5 shrink-0" />
          <span class="truncate">{{ meta.name }}</span>
        </DialogTitle>
        <DialogDescription>
          {{ formatFileSize(meta.size) }}<span v-if="meta.type"> · {{ meta.type }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="flex items-center justify-between gap-3 border-y py-2 text-xs text-muted-foreground">
        <span>Offset {{ pageStart.toString(16).padStart(8, '0').toUpperCase() }}</span>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="h-7 w-7" :disabled="currentPage <= 1" @click="previousPage">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
          <Button variant="ghost" size="icon" class="h-7 w-7" :disabled="currentPage >= totalPages" @click="nextPage">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(34rem,1.35fr)_minmax(26rem,0.9fr)]">
        <div class="min-h-0 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-5">
          <div v-if="rows.length === 0" class="text-muted-foreground">
            空文件
          </div>
          <div v-for="row in rows" :key="row.offset" class="grid min-w-max grid-cols-[5.5rem_24rem] gap-3">
            <span class="select-none text-muted-foreground">{{ row.offset.toString(16).padStart(8, '0').toUpperCase() }}</span>
            <span class="whitespace-pre">{{ row.hex }}</span>
          </div>
        </div>

        <pre class="min-h-0 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-5 whitespace-pre-wrap">{{ pageText || '空文件' }}</pre>
      </div>
    </DialogContent>
  </Dialog>
</template>
