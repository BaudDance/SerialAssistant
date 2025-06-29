<script setup>
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()
const { dataCode } = useDataCode()
const { lineEndingMode } = useSettingStore()

const { serialRate, defaultBaudRateList, baudRateList } = useSerialStore()

const defaultMinBaudRate = 300
const defaultMaxBaudRate = 10000000
const newBaudRate = ref(defaultMinBaudRate)

const reverseBaudRateList = computed(() => {
  // 倒序baudRateList
  return [...baudRateList.value]
})

function addNewBaudRate() {
  if (newBaudRate.value <= 0)
    return
  if (baudRateList.value.includes(newBaudRate.value))
    return
  baudRateList.value.push(newBaudRate.value)
  newBaudRate.value = defaultMinBaudRate
}

function canDelete(rate) {
  return !defaultBaudRateList.includes(rate)
}

function deleteRate(rate) {
  if (!canDelete(rate))
    return
  baudRateList.value.splice(baudRateList.value.indexOf(rate), 1)
  newBaudRate.value = defaultMinBaudRate
}

function handleBlur() {
  if (newBaudRate.value < defaultMinBaudRate)
    newBaudRate.value = defaultMinBaudRate
  else if (newBaudRate.value > defaultMaxBaudRate)
    newBaudRate.value = defaultMaxBaudRate
}

const disabledAddButton = computed(() => {
  let msg = ''
  if (newBaudRate.value < defaultMinBaudRate)
    msg = `波特率不能小于 ${defaultMinBaudRate}`
  else if (newBaudRate.value > defaultMaxBaudRate)
    msg = `波特率不能大于 ${defaultMaxBaudRate}`
  else if (baudRateList.value.includes(newBaudRate.value))
    msg = `波特率 ${newBaudRate.value} 已存在`
  return msg
})
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.serialRate]">
    <DialogContent class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[50dvh] p-0">
      <DialogHeader class="px-6 pt-6">
        <DialogTitle>自定义波特率设置</DialogTitle>
        <DialogDescription>
          添加、删除自定义波特率选项
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>波特率</TableHead>
              <TableHead class="text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="overflow-y-scroll">
            <TableRow v-for="item in reverseBaudRateList" :key="item">
              <TableCell>{{ item }}</TableCell>
              <TableCell class="text-right">
                <Badge v-if="canDelete(item)" class="cursor-pointer" variant="destructive" @click.stop="deleteRate(item)">
                  删除
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
      <DialogFooter class="pb-6 px-6 ">
        <div>
          <div class="flex items-center space-x-2">
            <input
              v-model="newBaudRate"
              type="number"
              :min="defaultMinBaudRate"
              :max="defaultMaxBaudRate"
              step="100"
              placeholder="输入自定义波特率"
              class="disable-spin-button flex h-9 w-36 rounded-md border border-input bg-transparent py-1 pl-3 text-sm  shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              @blur="handleBlur"
            >
            <Button :disabled="!!disabledAddButton" class="cursor-pointer" @click.stop="addNewBaudRate">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg>
              添加
            </Button>
          </div>
          <p role="alert" class="h-4 pt-2 text-xs font-medium text-destructive opacity-70">
            {{ disabledAddButton }}
          </p>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
