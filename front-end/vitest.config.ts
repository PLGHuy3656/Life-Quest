import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@dialogues': fileURLToPath(new URL('../mascot/fox-v2/dialogues', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 25000,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true
  }
})
