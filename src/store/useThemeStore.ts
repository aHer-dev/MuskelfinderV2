import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Theme } from '../types'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

/**
 * Was das Telefon eingestellt hat — der Erst-Default, solange niemand selbst gewählt hat.
 *
 * Bis 2026-07-14 stand hier hart `'light'`, und in `theme.css` lag eine
 * `prefers-color-scheme`-Regel, die das abfangen sollte. Sie konnte nie greifen (das
 * No-Flash-Skript setzt `data-theme` immer), also bekam ein Handy im Nachtmodus Weiß ins
 * Gesicht. Wer einmal umschaltet, hat eine explizite Wahl — die wird persistiert und schlägt
 * das System ab da.
 */
function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Theme-Store (persistiert). Default = System-Präferenz, Fallback light (Marke „Warm/Atlas").
 * Persistenz-Key `mf.theme` — der No-Flash-Inline-Script in index.html liest denselben Key
 * vor dem ersten Paint und fällt auf dieselbe System-Präferenz zurück.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      setTheme: (theme) => set({ theme }),
      toggle: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'mf.theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
