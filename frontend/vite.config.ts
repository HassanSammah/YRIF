import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://e259-197-186-3-121.ngrok-free.app',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
})
