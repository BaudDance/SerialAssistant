import path from 'node:path'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/],
        imports: [
          'vue',
          '@vueuse/core',
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: [
          'src/composables/**',
          'src/utils/**',
        ],
        vueTemplate: true,
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/],
        dts: 'src/components.d.ts',
      }),

      // https://github.com/tailwindlabs/tailwindcss
      tailwindcss(),

      // https://devtools.vuejs.org/
      vueDevTools(),

      // https://github.com/btd/rollup-plugin-visualizer
      mode === 'analyze' ? visualizer({ open: true, brotliSize: true }) : null,
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: Number(env.VITE_APP_DEV_PORT),
    },
    build: {
      chunkSizeWarningLimit: 2048,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            else if (id.includes('src/components')) {
              return 'components'
            }
            return null
          },
        },
      },
      minify: 'terser', // 使用 'terser' 获得更好压缩
      terserOptions: {
        compress: {
          drop_console: true, // 移除 console.* 调用但保留pure_funcs不包括的
          drop_debugger: true, // 移除 debugger 语句
          pure_funcs: ['console.log', 'console.info'], // 移除 console.log 和 console.info 调用
        },
      },
    },
  }
})
