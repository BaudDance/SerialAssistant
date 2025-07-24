<script setup>
import { Search } from 'lucide-vue-next'

const open = ref(false)

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <Button variant="secondary" class="w-48 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 cursor-pointer" @click.stop="toggle">
    <Search />搜索
  </Button>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Type a command or search..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem value="calendar">
          Calendar
        </CommandItem>
        <CommandItem value="search-emoji">
          Search Emoji
        </CommandItem>
        <CommandItem value="calculator">
          Calculator
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Settings">
        <CommandItem value="profile">
          Profile
        </CommandItem>
        <CommandItem value="billing">
          Billing
        </CommandItem>
        <CommandItem value="settings">
          Settings
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
