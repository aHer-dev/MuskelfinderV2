import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/' passt für Root-Deploy (eigene Domain, ADR 0002/0003). Wird stattdessen
// unter einem Projektpfad deployt (z. B. <name>.github.io/<repo>/), muss base auf
// '/<repo>/' gesetzt werden — sonst laden Assets/Sprite/Fonts nicht.
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})
