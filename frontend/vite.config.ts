import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Same-origin /api keeps the httpOnly refresh cookie simple (no CORS,
    // no credentials config). nginx does the same proxying in the full profile.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
