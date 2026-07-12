/* =========================================================================
   useLookupStore — Nachschlage-Zähler je Muskel (Etappe 7d, Brücke B1).
   src/store/useLookupStore.ts

   Die eine Idee dahinter: **Nachschlagen ist ein Lernsignal.** Wer denselben
   Muskel dreimal aufschlägt, kann ihn nicht. Diese Zahl ist deshalb kein
   Nutzungs-Tracking, sondern ein Lückenprotokoll — sie liegt lokal, verlässt
   das Gerät nie und steht dem Nutzer im Backup zur Verfügung.

   Schlüssel = `nameLatin`, wie bei den Lernkarten (ADR 0002 §2). Im Backup ist
   die Sektion additiv und optional.
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createEmptyLookupsSection } from '../persistence/sanitize';
import type { LookupsSection } from '../persistence/types';

interface LookupState {
  lookups: LookupsSection;

  /** Einen Detailseiten-Aufruf zählen. */
  record: (name: string, now?: Date) => void;
  /** Zähler vergessen — sobald ein Muskel im Karteikasten liegt, ist er keine Lücke mehr. */
  forget: (names: string[]) => void;
  /** Aufrufzahlen als flache Karte — so nimmt sie die Empfehlungs-Engine entgegen (7a). */
  getCounts: () => Record<string, number>;

  /* Persistenz-Bridge (Backup-Import / Reset). */
  replaceLookups: (lookups: LookupsSection) => void;
  resetLookups: () => void;
}

export const useLookupStore = create<LookupState>()(
  persist(
    (set, get) => ({
      lookups: createEmptyLookupsSection(),

      record: (name, now = new Date()) => {
        if (!name.trim()) return;
        set((s) => {
          const previous = s.lookups.entries[name];
          return {
            lookups: {
              ...s.lookups,
              entries: {
                ...s.lookups.entries,
                [name]: {
                  count: (previous?.count ?? 0) + 1,
                  lastLookup: now.toISOString(),
                },
              },
            },
          };
        });
      },

      forget: (names) => {
        set((s) => {
          const entries = { ...s.lookups.entries };
          let changed = false;
          for (const name of names) {
            if (name in entries) {
              delete entries[name];
              changed = true;
            }
          }
          return changed ? { lookups: { ...s.lookups, entries } } : {};
        });
      },

      getCounts: () => {
        const counts: Record<string, number> = {};
        for (const [name, entry] of Object.entries(get().lookups.entries)) {
          counts[name] = entry.count;
        }
        return counts;
      },

      replaceLookups: (lookups) => set({ lookups }),
      resetLookups: () => set({ lookups: createEmptyLookupsSection() }),
    }),
    {
      name: 'mf.lookups',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lookups: state.lookups }),
    },
  ),
);
