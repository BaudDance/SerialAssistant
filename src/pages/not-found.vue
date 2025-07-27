<script setup>
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

defineOptions({
  name: 'NotFoundPage',
})

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center flex-col space-y-4">
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">
      页面未找到
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      很抱歉，您访问的页面不存在或已被移动。
    </p>
    <div class="flex flex-col sm:flex-row gap-3 mt-10">
      <Button class="flex-1 cursor-pointer" @click="goHome">
        返回首页
      </Button>
    </div>
  </div>
</template>
