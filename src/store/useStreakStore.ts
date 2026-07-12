/* =========================================================================
   useStreakStore — Tages-Streak + Freeze (Etappe 7f).
   src/store/useStreakStore.ts

   Eigener Key `mf.streak`, additive optionale Backup-Sektion `streak` — dasselbe
   Muster wie `useLookupStore`/`useProfileStore`: ältere Versionen ignorieren den
   Schlüssel, ADR 0002 bleibt unangetastet.

   Die Rechnung selbst liegt rein und getestet in `persistence/streak.ts`; hier
   wird nur gehalten und weitergereicht.
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createEmptyStreakSection } from '../persistence/sanitize';
import {
  recordReview,
  rollOverStreak,
  type ReviewResult,
  type RollOverResult,
} from '../persistence/streak';
import type { StreakSection } from '../persistence/types';

interface StreakState {
  streak: StreakSection;

  /** Beim App-Start: Fehltage abrechnen (Freeze einlösen oder neu beginnen). */
  rollOver: (now?: Date) => RollOverResult;
  /** Eine bewertete Karte verbuchen; `dose` ist die heutige Tagesdosis (aus `data/today.ts`). */
  review: (dose: number, now?: Date) => ReviewResult;

  /* Persistenz-Bridge (Backup-Import / Reset). */
  replaceStreak: (streak: StreakSection) => void;
  resetStreak: () => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      streak: createEmptyStreakSection(),

      rollOver: (now = new Date()) => {
        const result = rollOverStreak(get().streak, now);
        set({ streak: result.streak });
        return result;
      },

      review: (dose, now = new Date()) => {
        const result = recordReview(get().streak, dose, now);
        set({ streak: result.streak });
        return result;
      },

      replaceStreak: (streak) => set({ streak }),
      resetStreak: () => set({ streak: createEmptyStreakSection() }),
    }),
    {
      name: 'mf.streak',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ streak: state.streak }),
    },
  ),
);
