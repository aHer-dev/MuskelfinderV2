import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/* Der Pfad, unter dem die App liegt.
   GitHub Pages serviert ein Projekt-Repo unter <user>.github.io/<repo>/ — dann MUSS base
   '/<repo>/' sein, sonst laden Sprite, Fonts und Bilder nicht (sie werden absolut vom
   Root geholt und laufen ins 404). Lokal faellt das nie auf: `vite preview` liefert fuer
   jeden Pfad die index.html aus, die Assets kommen trotzdem vom Root.

   Eigene Domain oder User-Site (<user>.github.io) statt Projektpfad? Dann beim Build
   `VITE_BASE=/` setzen. Alle Assets gehen ueber import.meta.env.BASE_URL bzw. werden von
   Vite umgeschrieben — diese eine Konstante ist die einzige Stellschraube. */
const base = process.env.VITE_BASE ?? '/MuskelfinderV2/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    // PWA/Offline (Etappe 5): App-Shell + JS/CSS/Sprite werden vorab gecacht, Muskelbilder
    // laufzeit-gecacht (CacheFirst). registerType 'autoUpdate' → neuer SW übernimmt still.
    // Bleibt statisch/lokal (CLAUDE.md): der SW greift nur auf Repo-Assets zu.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Anatomie Fokus · Muskelfinder',
        short_name: 'Muskelfinder',
        description: 'Nachschlagewerk & Lern-Tool für die Skelettmuskulatur.',
        lang: 'de',
        // Muessen dem base folgen — sonst installiert die PWA einen Scope, der nicht existiert.
        start_url: base,
        scope: base,
        // Ohne `id` leitet der Browser die App-Identitaet aus `start_url` ab. Dann gilt eine
        // installierte App nach einer Aenderung von `start_url` (etwa auf '#/heute') als
        // ANDERE App: Der Nutzer haette zwei Icons und muesste neu installieren. Explizit
        // gesetzt bleibt die Identitaet an `base` haengen und ueberlebt solche Umbauten.
        id: base,
        display: 'standalone',
        // Rueckfallkette, falls ein Browser `standalone` nicht kann.
        display_override: ['standalone', 'minimal-ui'],
        // BEWUSST KEIN `orientation`: Die Faecher-Tabelle und die Muskelbilder gewinnen im
        // Querformat, und ein erzwungenes Portrait waere auf einem Tablet nur laestig.
        // Ein Feld, das die Wahl des Nutzers ueberschreibt, braucht einen Grund — hier gibt
        // es keinen.
        categories: ['education', 'medical'],
        background_color: '#f1efe9',
        theme_color: '#f1efe9',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Mit Screenshots zeigt Chrome auf Android den reichen Installationsdialog (Bild +
        // Beschreibung) statt der kargen Zeile. `form_factor: 'narrow'` ist Pflicht, sonst
        // ignoriert Chrome sie fuers Handy. Erzeugt von `scripts/make-screenshots.mjs`.
        screenshots: [
          {
            src: 'screenshots/heute-narrow.png', sizes: '412x915', type: 'image/png',
            form_factor: 'narrow', label: 'Der Tagesplan mit den fälligen Karten',
          },
          {
            src: 'screenshots/lernkarten-narrow.png', sizes: '412x915', type: 'image/png',
            form_factor: 'narrow', label: 'Eine Lernkarte mit Muskelbild',
          },
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
