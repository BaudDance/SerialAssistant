<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRecordStore } from '@/store/useRecordStore'
import RecordList from './RecordList.vue'

const { recordCount, pinBottom, scrollToRecordIndex } = useRecordStore()
const listRef = ref(null)

watch(recordCount, (value, oldValue) => {
  if (pinBottom.value && value !== oldValue) {
    nextTick(() => {
      listRef.value?.scrollToBottom()
    })
  }
})

watch(scrollToRecordIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < recordCount.value) {
    nextTick(() => {
      listRef.value?.scrollToIndex(newIndex)
    })
  }
})
</script>

<template>
  <RecordList ref="listRef" class="h-full w-full" empty-text="暂无接收记录" :stick-to-bottom="pinBottom" />
</template>
