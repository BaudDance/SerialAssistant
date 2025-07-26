<script setup>
import { useDataCode } from '@/composables/useDataCode/useDataCode'
import { useSerialStore } from '@/store/useSerialStore'
import { useSettingStore } from '@/store/useSettingStore'
import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()
const { dataCode } = useDataCode()
const { lineEndingMode } = useSettingStore()
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

      <Tabs default-value="general" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="general">
            常规设置
          </TabsTrigger>
          <TabsTrigger value="cache">
            缓存设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" class="space-y-4 mt-4">
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
        </TabsContent>

        <TabsContent value="cache" class="space-y-6 mt-4">
          <RecordCache />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
