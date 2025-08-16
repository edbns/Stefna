import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000, // Changed from 3002 to 3000
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ]
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress dynamic import warnings that slow down builds
        if (warning.code === 'DYNAMIC_IMPORT_ASSERTIONS') return;
        if (warning.message.includes('dynamic import will not move module into another chunk')) return;
        warn(warning);
      },
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          // Core app chunks
          'app-core': [
            './src/stores/generationStore',
            './src/stores/presetsStore',
            './src/stores/sourceStore'
          ],
          'app-services': [
            './src/services/aiGenerationService',
            './src/services/aiService',
            './src/services/uploadSource'
          ],
          'app-components': [
            './src/components/Composer',
            './src/components/MediaCard',
            './src/components/MasonryMediaGrid'
          ]
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false
  }
}) 