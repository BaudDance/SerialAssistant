import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const dialogKeys = {
  downLoadDriver: 'downLoadDriver',
  ascii: 'ascii',
  setting: 'setting',
  serialRate: 'serialRate',
  filePreview: 'filePreview',
}

export const useDialog = createGlobalState(() => {
  const visible = reactive(Object.fromEntries(Object.values(dialogKeys).map(key => [key, false])))
  const payloads = reactive(Object.fromEntries(Object.values(dialogKeys).map(key => [key, null])))

  function open(key, payload = null) {
    console.log('open', key)
    payloads[key] = payload
    visible[key] = true
  }

  function close(key) {
    visible[key] = false
    payloads[key] = null
  }

  return {
    visible,
    payloads,
    open,
    close,
  }
})
