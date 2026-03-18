import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api to local backend only in dev (when VITE_API_URL is not set)
    proxy: process.env.VITE_API_URL ? {} : {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
