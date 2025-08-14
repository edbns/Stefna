import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Changed from 3002 to 3000
    host: true
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      keep_fnames: true,
      mangle: { keep_fnames: true, keep_classnames: true },
      compress: { keep_fargs: true }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}) 