import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Theme } from '../types'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

/**
 * Der Erst-Default: **Hell**, unabhängig davon, was das Gerät eingestellt hat
 * (Ansage des Projektinhabers, 2026-07-26).
 *
 * ## Wie es hierher kam — bitte nicht im Kreis drehen
 * 1. Bis 2026-07-14 stand hier hart `'light'`, UND in `theme.css` lag eine
 *    `prefers-color-scheme`-Regel, die das abfangen sollte. Die konnte **nie** greifen,
 *    weil das No-Flash-Skript `data-theme` immer setzt (`:not([data-theme])` traf nie zu).
 *    Ein Handy im Nachtmodus bekam also Weiß ins Gesicht, obwohl der Code aussah, als wäre
 *    daran gedacht. **Das war der Fehler: toter Code, nicht der helle Default.**
 * 2. Am 2026-07-14 wurde daraus „folgt dem Gerät".
 * 3. Am 2026-07-26 ist die Vorgabe wieder **hell** — diesmal als bewusste Wahl und ohne
 *    toten Gegencode: Die Marke „Warm/Atlas" ist auf dem warmen Papier gestaltet, und das
 *    soll ein neuer Nutzer zuerst sehen.
 *
 * **Wer das erneut anfasst, löscht nicht einfach diese Zeile:** Es gibt DREI Stellen, die
 * dieselbe Regel kennen müssen — dieser Store, das No-Flash-Skript in `index.html` (vor dem
 * ersten Paint) und das `theme-color`-Meta (die Browserleiste). Laufen sie auseinander,
 * blitzt beim Laden die falsche Farbe oder die Systemleiste passt nicht zur Seite.
 *
 * Die ausdrückliche Wahl über den Umschalter wird weiter persistiert und schlägt die
 * Vorgabe ab da — sie ist der Weg für alle, die Dunkel brauchen.
 */
const DEFAULT_THEME: Theme = 'light'

/**
 * Theme-Store (persistiert). Default = hell (Marke „Warm/Atlas"), ausdrückliche Wahl gewinnt.
 * Persistenz-Key `mf.theme` — das No-Flash-Inline-Skript in index.html liest denselben Key
 * vor dem ersten Paint und fällt auf denselben Default zurück.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      toggle: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'mf.theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
