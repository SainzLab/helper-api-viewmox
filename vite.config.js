import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import Inspector from 'vite-plugin-vue-inspector'; 

export default defineConfig({
  plugins: [
    vue(),
    Inspector({
      enabled: true,
      toggleButtonVisibility: 'always', 
    })
  ],
  server: {
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'public/dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: 'src/frontend/main.js'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src/frontend'),
    }
  }
});