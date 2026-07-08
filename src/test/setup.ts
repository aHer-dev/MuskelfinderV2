import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom kennt matchMedia nicht — Minimal-Stub, damit useMediaQuery in Tests läuft.
// Default: nichts matcht (→ mobile Layout im Test). Einzeltests können es überschreiben.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// React-Testing-Library nach jedem Test aufräumen (globals=false → manuell).
afterEach(() => {
  cleanup()
})
