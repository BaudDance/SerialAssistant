<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useSendStore } from '@/store/useSendStore'

const { isAutoSending, send } = useSendStore()

const autoSendTime = ref(1000)

let timer = null

async function timeoutFunc() {
  if (isAutoSending.value) {
    send()
    if (autoSendTime.value <= 0)
      return
    timer = setTimeout(timeoutFunc, autoSendTime.value)
  }
}

watch(isAutoSending, (enabled) => {
  if (enabled) {
    console.log('auto send enabled')
    if (autoSendTime.value <= 0)
      return
    send()
    timer = setTimeout(timeoutFunc, autoSendTime.value)
  }
  else {
    console.log('auto send disabled')
    clearTimeout(timer)
  }
})

// 销毁定时器防止内存泄漏
onBeforeUnmount(() => {
  clearTimeout(timer)
  isAutoSending.value = false
  timer = null
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child class="cursor-pointer">
      <Button variant="ghost">
        自动发送
      </Button>
    </PopoverTrigger>
    <PopoverContent side="top">
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="font-medium leading-none flex items-center justify-between">
            <div class="flex items-center">
              <span class="mr-2">
                自动发送设置
              </span>
            </div>
            <Switch id="autoSendSwitch" v-model="isAutoSending" class="cursor-pointer" :disabled="!autoSendTime || autoSendTime <= 0" />
          </h4>
          <p class="text-sm text-muted-foreground">
            {{ autoSendTime ? `启用后自动每 ${autoSendTime} 毫秒发送一次数据` : '请输入自动发送间隔时间' }}
          </p>
        </div>
        <div class="grid gap-2">
          <div class="grid grid-cols-3 items-center gap-4">
            <NumberField id="autoSendNumberField" v-model="autoSendTime" :min="0" class="col-span-2">
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <Label for="autoSendNumberField"> ms / 次</Label>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
