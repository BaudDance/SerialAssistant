<script setup>
import { computed } from 'vue'
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()
const { dataCode } = useDataCode()
const { lineEndingMode, lineSelfEnding } = useSettingStore()
const showCustomInput = computed(() => lineEndingMode.value === '自定义')
const { hasDecTyps } = useSerialStore()
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.setting]">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>设置</DialogTitle>
        <DialogDescription>
          应用程序配置
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 mt-4">
        <div class="flex h-9">
          <Label class="w-36">行尾自动添加</Label>
          <Select v-model="lineEndingMode">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择结束符" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="无">
                  无
                </SelectItem>
                <SelectItem value="LF">
                  LF
                </SelectItem>
                <SelectItem value="CR">
                  CR
                </SelectItem>
                <SelectItem value="CRLF">
                  CRLF
                </SelectItem>
                <SelectItem value="自定义">
                  自定义
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div v-if="showCustomInput" class="flex h-9 items-center">
          <Label class="w-36">自定义结束符</Label>
          <div class="w-full flex items-center gap-2">
            <Input
              v-model="lineSelfEnding"
              placeholder="自定义结束字符串"
              class="w-full"
            />
          </div>
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
      </div>
    </DialogContent>
  </Dialog>
</template>
