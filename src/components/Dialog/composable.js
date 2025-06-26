import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const dialogKeys = {
  downLoadDriver: 'downLoadDriver',
  ascii: 'ascii',
  setting: 'setting',
}

export const useDialog = createGlobalState(() => {
  const visible = reactive(Object.fromEntries(Object.values(dialogKeys).map(key => [key, false])))

  function open(key) {
    console.log('open', key)
    visible[key] = true
  }

  function close(key) {
    visible[key] = false
  }

  return {
    visible,
    open,
    close,
  }
})
