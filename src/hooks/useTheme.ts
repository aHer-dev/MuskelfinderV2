import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import type { Theme } from '../types'

/** Flächenfarbe der Browserleiste je Theme — dieselben Werte wie im No-Flash-Skript. */
const THEME_COLOR: Record<Theme, string> = {
  light: '#f1efe9',
  dark: '#0b0c0e',
}

/**
 * Spiegelt den Theme-Store auf das `data-theme`-Attribut von <html>.
 * Einmal in der App-Wurzel aufrufen. Der erste Wert wird bereits durch den
 * Inline-Script in index.html gesetzt (kein Flash) — dieser Hook hält ihn synchron.
 *
 * Er zieht ausserdem `theme-color` nach: Seit die App hell startet (2026-07-26) haengt die
 * Farbe der Browserleiste am tatsaechlichen Theme, nicht mehr an `prefers-color-scheme` —
 * sonst umrahmt auf einem Handy im Nachtmodus eine dunkle Systemleiste eine helle Seite.
 */
export function useTheme(): Theme {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  return theme
}
