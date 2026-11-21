
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '0.0.0.0',
    port: 5190,
    strictPort: true,
  },

  preview: {
    host: '0.0.0.0',
    port: 5190,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,

    // Let Vite/Rollup handle dependency chunking.
    // Route-level lazy loading will provide code splitting.
  },
})
