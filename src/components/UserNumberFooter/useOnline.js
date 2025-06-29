import {
  createGlobalState,
  useIntervalFn,
  useLocalStorage,
} from '@vueuse/core'

import { ref } from 'vue'

/**
 * 生成一个随机的 v4 uuid
 * @returns uuid
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const baseURL = 'https://led.baud-dance.com/api'

async function getOnline(userId) {
  const res = await fetch(`${baseURL}/online/serial/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await res.json()
}

export default createGlobalState(() => {
  const uuid = useLocalStorage('uuid', generateUUID())
  const online = ref({ led: 'none' })
  const { pause, resume } = useIntervalFn(
    async () => {
      console.log('uuid:', uuid.value)
      const res = await getOnline(uuid.value)
      console.log('res:', res)
      online.value = res.data
    },
    1000 * 60,
    { immediate: true, immediateCallback: true },
  )

  return { online, pause, resume }
})
