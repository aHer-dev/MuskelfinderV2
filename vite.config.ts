import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base: '/' passt für Root-Deploy (eigene Domain, ADR 0002/0003). Wird stattdessen
// unter einem Projektpfad deployt (z. B. <name>.github.io/<repo>/), muss base auf
// '/<repo>/' gesetzt werden — sonst laden Assets/Sprite/Fonts nicht.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // PWA/Offline (Etappe 5): App-Shell + JS/CSS/Sprite werden vorab gecacht, Muskelbilder
    // laufzeit-gecacht (CacheFirst). registerType 'autoUpdate' → neuer SW übernimmt still.
    // Bleibt statisch/lokal (CLAUDE.md): der SW greift nur auf Repo-Assets zu.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Anatomie Fokus · Muskelfinder',
        short_name: 'Muskelfinder',
        description: 'Nachschlagewerk & Lern-Tool für die Skelettmuskulatur.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f1efe9',
        theme_color: '#f1efe9',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-Shell + Code + Sprite vorab cachen; Muskelbilder bewusst NICHT (zu viele/gross).
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // HashRouter: alle Client-Routen liegen unter index.html → Offline-Navigation trägt.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Muskel-/Quizbilder: erst Cache, dann Netz — offline verfügbar, sobald einmal geladen.
            urlPattern: ({ url }) => url.pathname.includes('/muscles/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'muscle-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})
