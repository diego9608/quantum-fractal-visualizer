import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['three', 'dat.gui', 'tone']
  }
});