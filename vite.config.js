import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对基址：同时适配根路径（Surge）与子路径（GitHub Pages /repo/）
  base: './',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true // 放行反向代理域名（云端预览/托管）
  },
  // face-api.js 依赖较大的 TF.js 包，提高打包告警阈值
  build: {
    chunkSizeWarningLimit: 2000
  }
})
