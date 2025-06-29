import { createGlobalState, useStorage } from '@vueuse/core'
import { ref } from 'vue'

export const useFullScreen = createGlobalState(() => {
  const isFullScreen = useStorage('isFullScreen', ref(false))

  function toggleFullScreen() {
    isFullScreen.value = !isFullScreen.value
  }

  return {
    isFullScreen,
    toggleFullScreen,
  }
})
