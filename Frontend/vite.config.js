import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000/api'
  const target = new URL(apiUrl, 'http://localhost:3000').origin

  return {
    plugins: [react()],
    server: {
      port: 5001,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
