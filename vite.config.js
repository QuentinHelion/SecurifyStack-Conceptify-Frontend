// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // listen on 0.0.0.0
    port: 3000,    // switch from 5173 → 3000
    open: false,   // or true to auto‐open in your browser
  },
})