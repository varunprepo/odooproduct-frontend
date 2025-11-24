import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      //"/api": "http://localhost:3000"
      "/api": "https://odooproduct-backend.onrender.com:3000"
    }
  }
})
