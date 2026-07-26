import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple Vite config - just enables React support
export default defineConfig({
  plugins: [react()],
})
