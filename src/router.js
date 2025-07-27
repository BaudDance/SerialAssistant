import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/pages/index.vue'
import RecordPage from '@/pages/record.vue'

// 定义路由
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/record', component: RecordPage },
    { path: '/404', component: () => import('@/pages/not-found.vue') },
    { path: '/:catchAll(.*)', redirect: '/404' },
  ],
})

export { router }
