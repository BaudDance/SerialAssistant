<script setup>
import { Check, ChevronsUpDown, LoaderCircle, Pencil } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useLocalFonts } from '@/composables/useLocalFonts'
import { useSerialDataFont } from '@/composables/useSerialDataFont'
import { useSettingStore } from '@/store/useSettingStore'
import {
  BUILTIN_SERIAL_DATA_FONT_FAMILY,
  normalizeSerialDataFontFamily,
  SYSTEM_SERIAL_DATA_FONT_FAMILY,
} from '@/utils/serialDataFont'

const popoverOpen = ref(false)
const editingCustomFont = ref(false)
const customFontName = ref('')

const { serialDataFontFamily } = useSettingStore()
const { serialDataFontLoadState } = useSerialDataFont()
const {
  localFontFamilies,
  localFontStatus,
  requestLocalFonts,
} = useLocalFonts()

const availableLocalFontFamilies = computed(() => localFontFamilies.value.filter((family) => {
  const normalized = normalizeSerialDataFontFamily(family)
  return normalized !== BUILTIN_SERIAL_DATA_FONT_FAMILY
    && normalized !== SYSTEM_SERIAL_DATA_FONT_FAMILY
}))

const selectedFontLabel = computed(() => {
  if (serialDataFontFamily.value === BUILTIN_SERIAL_DATA_FONT_FAMILY)
    return 'JetBrains Maple Mono（内置）'
  if (serialDataFontFamily.value === SYSTEM_SERIAL_DATA_FONT_FAMILY)
    return '系统等宽字体'
  return serialDataFontFamily.value
})

function handlePopoverOpen(value) {
  popoverOpen.value = value
  if (!value) {
    editingCustomFont.value = false
    return
  }

  requestLocalFonts()
}

function selectFont(family) {
  serialDataFontFamily.value = normalizeSerialDataFontFamily(family)
  popoverOpen.value = false
  editingCustomFont.value = false
}

function startCustomFontEdit() {
  customFontName.value = [BUILTIN_SERIAL_DATA_FONT_FAMILY, SYSTEM_SERIAL_DATA_FONT_FAMILY]
    .includes(serialDataFontFamily.value)
    ? ''
    : serialDataFontFamily.value
  editingCustomFont.value = true
}

function saveCustomFont() {
  const family = customFontName.value.trim()
  if (!family)
    return
  selectFont(family)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex min-h-9 items-center">
      <Label class="w-36">收发字体</Label>
      <div class="min-w-0 w-full">
        <Popover :open="popoverOpen" @update:open="handlePopoverOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="popoverOpen"
              class="w-full min-w-0 justify-between font-normal"
            >
              <span class="truncate">{{ selectedFontLabel }}</span>
              <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-0">
            <form v-if="editingCustomFont" class="space-y-3 p-3" @submit.prevent="saveCustomFont">
              <div class="space-y-1.5">
                <Label for="custom-serial-data-font">自定义字体名称</Label>
                <Input
                  id="custom-serial-data-font"
                  v-model="customFontName"
                  autofocus
                  placeholder="例如：Sarasa Mono SC"
                />
              </div>
              <div class="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" @click="editingCustomFont = false">
                  返回
                </Button>
                <Button type="submit" size="sm" :disabled="!customFontName.trim()">
                  使用字体
                </Button>
              </div>
            </form>

            <Command v-else>
              <CommandInput placeholder="搜索字体" />
              <CommandList>
                <CommandEmpty>未找到匹配字体</CommandEmpty>

                <CommandGroup heading="推荐">
                  <CommandItem
                    value="builtin-jetbrains-maple-mono"
                    @select="selectFont(BUILTIN_SERIAL_DATA_FONT_FAMILY)"
                  >
                    <Check
                      class="size-4"
                      :class="serialDataFontFamily === BUILTIN_SERIAL_DATA_FONT_FAMILY ? 'opacity-100' : 'opacity-0'"
                    />
                    <span class="flex-1">JetBrains Maple Mono（内置）</span>
                    <span class="text-xs text-muted-foreground">推荐</span>
                  </CommandItem>
                  <CommandItem value="system-monospace" @select="selectFont(SYSTEM_SERIAL_DATA_FONT_FAMILY)">
                    <Check
                      class="size-4"
                      :class="serialDataFontFamily === SYSTEM_SERIAL_DATA_FONT_FAMILY ? 'opacity-100' : 'opacity-0'"
                    />
                    系统等宽字体
                  </CommandItem>
                  <CommandItem value="custom-font-name" @select="startCustomFontEdit">
                    <Pencil class="size-4" />
                    手动输入字体名称…
                  </CommandItem>
                </CommandGroup>

                <div v-if="localFontStatus === 'loading'" class="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <LoaderCircle class="size-4 animate-spin" />
                  正在读取本机字体…
                </div>
                <div v-else-if="localFontStatus === 'unsupported'" class="px-3 py-3 text-sm text-muted-foreground">
                  当前浏览器不支持读取本机字体，可手动输入字体名称。
                </div>
                <div v-else-if="localFontStatus === 'denied'" class="px-3 py-3 text-sm text-muted-foreground">
                  未获得本机字体权限，可在站点权限中开启或手动输入。
                </div>
                <div v-else-if="localFontStatus === 'error'" class="px-3 py-3 text-sm text-muted-foreground">
                  读取本机字体失败，可手动输入字体名称。
                </div>

                <CommandGroup v-if="availableLocalFontFamilies.length" heading="本机字体">
                  <CommandItem
                    v-for="family in availableLocalFontFamilies"
                    :key="family"
                    :value="`local-font-${family}`"
                    @select="selectFont(family)"
                  >
                    <Check
                      class="size-4"
                      :class="serialDataFontFamily === family ? 'opacity-100' : 'opacity-0'"
                    />
                    <span class="truncate">{{ family }}</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <div class="flex">
      <div class="w-36" />
      <div class="min-w-0 w-full rounded-md border bg-muted/30 px-3 py-2 text-xs">
        <div class="serial-data-font whitespace-pre overflow-x-auto">
          <div>01234567890123456789|</div>
          <div>中文中文中文中文中文|</div>
        </div>
        <p class="mt-1.5 text-muted-foreground">
          <span v-if="serialDataFontLoadState === 'loading'">字体加载中…</span>
          <span v-else>请选择支持中文且中英文宽度为 2:1 的等宽字体。</span>
        </p>
      </div>
    </div>
  </div>
</template>
