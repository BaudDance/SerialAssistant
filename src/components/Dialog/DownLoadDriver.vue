<script setup>
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()

const drivers = [
  {
    url: '/drivers/CH340_CH341_Windows_x64_x86.EXE',
    platform: ['windows'],
    chips: ['CH340', 'CH341'],
  },
  {
    url: '/drivers/CH340_CH341_MacOS.dmg',
    platform: ['mac'],
    chips: [
      'CH340',
      'CH341',
      'CH342',
      'CH343',
      'CH344',
      'CH347',
      'CH9101',
      'CH9102',
      'CH9103',
      'CH9104',
      'CH9143',
    ],
  },
  {
    url: '/drivers/CH340_CH341_LINUX.ZIP',
    platform: ['linux'],
    chips: [
      'CH340',
      'CH341',
      'CH342',
      'CH343',
      'CH344',
      'CH347',
      'CH9101',
      'CH9102',
      'CH9103',
      'CH9104',
      'CH9143',
    ],
  },
  {
    url: '/drivers/CH343SER_Windows_x64_x86.EXE',
    platform: ['windows'],
    chips: [
      'CH342',
      'CH343',
      'CH344',
      'CH347',
      'CH9101',
      'CH9102',
      'CH9103',
      'CH9143',
    ],
  },
  {
    url: '/drivers/CP210x_Windows_Drivers_x64_x86.zip',
    platform: ['windows'],
    chips: ['CP210x'],
  },
  {
    url: '/drivers/CP210x_MAC_OSX_Driver.zip',
    platform: ['mac'],
    chips: ['CP210x'],
  },
  {
    url: '/drivers/FT232_Windows_x64_x86.exe',
    platform: ['windows'],
    chips: ['FT系列'],
  },
  {
    url: '/drivers/FT232_MacOS_10_15.zip',
    platform: ['mac'],
    chips: ['FT系列'],
  },
  {
    url: '/drivers/ftdi_sio.tar.gz',
    platform: ['linux'],
    chips: ['FT系列'],
  },
]

const platforms = [...new Set(drivers.flatMap(driver => driver.platform))]
const chips = [...new Set(drivers.flatMap(driver => driver.chips))].sort()

const platform = ref(undefined)
const chip = ref(undefined)

const downloadUrl = computed(() => {
  return drivers.find(
    driver =>
      driver.platform.includes(platform.value)
      && driver.chips.includes(chip.value),
  )?.url
})

// 从 downloadUrl 提取文件名
const downloadFileName = computed(() => {
  if (!downloadUrl.value)
    return null
  return downloadUrl.value.split('/').pop()
})

watch(() => visible[dialogKeys.downLoadDriver], (newVal) => {
  if (!newVal) {
    platform.value = undefined
    chip.value = undefined
  }
})
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.downLoadDriver]">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>常见驱动下载</DialogTitle>
        <DialogDescription>
          请选择操作系统和芯片型号，下载对应驱动
        </DialogDescription>
      </DialogHeader>
      <Select v-model="platform">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择操作系统" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>操作系统</SelectLabel>
            <SelectItem v-for="p in platforms" :key="p" :value="p">
              {{ p }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select v-model="chip">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="请选择芯片型号" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>芯片型号</SelectLabel>
            <SelectItem v-for="c in chips" :key="c" :value="c">
              {{ c }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <DialogFooter>
        <a :href="downloadUrl" class="w-full" :download="downloadFileName" :class="[downloadUrl ? 'cursor-pointer' : 'cursor-not-allowed']">
          <Button
            class="w-full "
            :class="[downloadUrl ? 'cursor-pointer' : 'cursor-not-allowed']"
            :disabled="!downloadUrl"
          >
            {{
              downloadUrl
                ? "下载"
                : platform && chip
                  ? "抱歉，未收录此驱动，请到芯片官网寻找"
                  : "请 选 择"
            }}
          </Button>
        </a>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
