import {
  createGlobalState,
  useIntervalFn,
  useLocalStorage,
} from '@vueuse/core'
import { ref } from 'vue'
import { generateUUID } from '@/utils/uuid'

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
