import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [wasm(), react()],
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
