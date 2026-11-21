import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built sandbox works from any folder or static server path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: { output: { manualChunks: { three: ['three'], react: ['react', 'react-dom'], r3f: ['@react-three/fiber'] } } },
  },
  server: { port: 5173 },
});
