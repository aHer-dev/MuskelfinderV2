import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Theme } from '../types'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

/**
 * Theme-Store (persistiert). Default = light (Marken-Vorgabe „Warm/Atlas").
 * Persistenz-Key `mf.theme` — der No-Flash-Inline-Script in index.html liest
 * denselben Key vor dem ersten Paint.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggle: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'mf.theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
