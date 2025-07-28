const offlinePrefix = '[Offline] '

export function listenNetworkStatus() {
  const offlineHandler = (event) => {
    console.log('Network: Offline')
    document.title = offlinePrefix + document.title
  }

  const onlineHandler = (event) => {
    console.log('Network: Online')
    document.title = document.title.replace(offlinePrefix, '')
  }

  addEventListener('offline', offlineHandler)
  addEventListener('online', onlineHandler)

  // Initial title
  if (!navigator.onLine) {
    document.title = offlinePrefix + document.title
  }

  // 返回清理函数
  return () => {
    removeEventListener('offline', offlineHandler)
    removeEventListener('online', onlineHandler)
    console.log('Network status listeners removed')
  }
}
