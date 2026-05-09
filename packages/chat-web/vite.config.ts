import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_DEV_PORT ?? 5174),
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3030',
      '/sync': {
        target: 'ws://127.0.0.1:3030',
        ws: true,
      },
    },
  },
})
