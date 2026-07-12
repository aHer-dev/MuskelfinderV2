import { create } from 'zustand'
import type { XpAward } from './useProgressStore'

export type ToastKind = 'xp' | 'level' | 'info'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, kind?: ToastKind) => void
  dismiss: (id: number) => void
}

const TTL_MS = 2400
let seq = 0

/**
 * Flüchtige Toast-Rückmeldungen (Gamification, V1-Parität). Nicht persistiert, kein
 * `window.*`-Global — die Datenschicht meldet über `notifyAward`, der Host rendert.
 * Auto-Ausblendung nach {@link TTL_MS}.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }].slice(-4) }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, TTL_MS)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/**
 * Meldet eine XP-Vergabe als Toast: Level-Up prominent, ansonsten „+N XP".
 * `label` hängt einen kurzen Kontext an (z. B. „Serie!" oder „Tagesbonus").
 */
export function notifyAward(award: XpAward, label?: string): void {
  if (award.levelUp) {
    useToastStore.getState().push(`Level ${award.levelAfter} erreicht!`, 'level')
  }
  if (award.xpAdded > 0) {
    useToastStore.getState().push(`+${award.xpAdded} XP${label ? ` · ${label}` : ''}`, 'xp')
  }
}

/** Schlichte Textmeldung ohne XP (Etappe 7f: Tagesdosis, Freeze). */
export function notifyToast(message: string): void {
  useToastStore.getState().push(message, 'info')
}
