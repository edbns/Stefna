import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'terser', // Better minification than esbuild for production
    rollupOptions: {

      output: {
        manualChunks: {
          // Core React chunks
          vendor: ['react', 'react-dom'],
          // Auth-related chunks
          auth: ['jose', 'jsonwebtoken'],
          // UI and animation chunks
          ui: ['framer-motion', 'clsx', 'tailwind-merge'],
          // Database and API chunks
          data: ['@neondatabase/serverless', '@prisma/client', 'pg'],
          // Utility chunks
          utils: ['lucide-react', 'nanoid', 'zustand', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Performance optimizations
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    reportCompressedSize: true,
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_debugger: true,
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'lucide-react',
      'jose',
      'jsonwebtoken',
      'framer-motion',
      'clsx',
      'tailwind-merge',
      'zustand',
      'nanoid'
    ]
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false // Disable error overlay in dev for better performance
    },
    allowedHosts: [
      'devserver-main--stefna.netlify.app',
      'localhost',
      '127.0.0.1'
    ]
  }
}) 