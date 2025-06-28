<script setup>
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import { useDataCode } from '@/utils/useDataCode/useDataCode'
import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()
const { dataCode } = useDataCode()
const { lineEndingMode } = useSettingStore()
const { hasDecTyps } = useSerialStore()
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.setting]">
    <DialogContent class="">
      <DialogHeader class="">
        <DialogTitle>设置</DialogTitle>
        <DialogDescription>
          常用设置
        </DialogDescription>
      </DialogHeader>

      <div class="flex h-9">
        <Label class="w-36">行尾自动添加</Label>
        <Select v-model="lineEndingMode">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="请选择结束符" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value=" ">
                无
              </SelectItem>
              <SelectItem value="\n">
                LF
              </SelectItem>
              <SelectItem value="\r">
                CR
              </SelectItem>
              <SelectItem value="\r\n">
                CRLF
              </SelectItem>
              <SelectItem value="undefined">
                自定义
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex h-9">
        <Label class="w-36">中文编码</Label>
        <Select v-model="dataCode">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="请选择中文编码方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="UTF-8">
                UTF-8
              </SelectItem>
              <SelectItem value="GBK">
                GBK
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex h-9">
        <Label class="w-36">十进制格式</Label>
        <div class="w-full flex items-center">
          <Checkbox v-model="hasDecTyps" />
        </div>
      </div>
      <DialogFooter />
    </DialogContent>
  </Dialog>
</template>
