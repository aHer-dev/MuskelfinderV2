import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import type { Theme } from '../types'

/**
 * Spiegelt den Theme-Store auf das `data-theme`-Attribut von <html>.
 * Einmal in der App-Wurzel aufrufen. Der erste Wert wird bereits durch den
 * Inline-Script in index.html gesetzt (kein Flash) — dieser Hook hält ihn synchron.
 */
export function useTheme(): Theme {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return theme
}
