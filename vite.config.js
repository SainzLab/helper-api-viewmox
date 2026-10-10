import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    cors: true,
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