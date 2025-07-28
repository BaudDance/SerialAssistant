import { createRouter, createWebHashHistory } from 'vue-router'
import { useNprogress } from '@/composables/useNprogress'
import Home from '@/pages/index.vue'
import RecordPage from '@/pages/record.vue'

const NProgress = useNprogress()

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

router.beforeEach((_to, _from, next) => {
  NProgress.start()
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export { router }
