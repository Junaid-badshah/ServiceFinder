import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082', // 👈 Yahan 8082 kar diya hai
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
