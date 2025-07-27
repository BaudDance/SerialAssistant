import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'
// register service worker

// async function registerServiceWorker() {
//   if ('serviceWorker' in navigator) {
//     try {
//       const registration = await navigator.serviceWorker.register('/sw.js', {
//         scope: '/',
//       })
//       if (registration.installing) {
//         console.log('Service worker installing')
//       }
//       else if (registration.waiting) {
//         console.log('Service worker installed')
//       }
//       else if (registration.active) {
//         console.log('Service worker active')
//       }
//     }
//     catch (error) {
//       console.error(`Registration failed with ${error}`)
//     }
//   }
// }

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister() // 注销所有旧的 Service Worker
    })
  })

  // navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
  //   if (registration.waiting) {
  //     registration.waiting.postMessage({ type: "SKIP_WAITING" }); // 跳过等待状态
  //   } else if (registration.installing) {
  //     registration.installing.postMessage({ type: "SKIP_WAITING" });
  //   }
  // });
}
// console.log('你好，我是keysking')
// registerServiceWorker();

// mount the main app
createApp(App).use(router).mount('#app')
