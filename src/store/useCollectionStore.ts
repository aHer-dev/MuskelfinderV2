/* =========================================================================
   useCollectionStore — Merkliste (Sammlung) des Nutzers.
   src/store/useCollectionStore.ts

   Reines V2-Konzept: gemerkte Muskeln nach Routing-id. NICHT Teil des
   V1-Backup-Formats (das kennt nur flashcards/xp/quizSeries) — deshalb eigener
   Key `mf.collection` und keine Backup-Bridge.
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CollectionState {
  muscleIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  clear: () => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      muscleIds: [],

      add: (id) => {
        if (get().muscleIds.includes(id)) return;
        set((s) => ({ muscleIds: [...s.muscleIds, id] }));
      },

      remove: (id) => set((s) => ({ muscleIds: s.muscleIds.filter((m) => m !== id) })),

      toggle: (id) => {
        const has = get().muscleIds.includes(id);
        set((s) => ({
          muscleIds: has ? s.muscleIds.filter((m) => m !== id) : [...s.muscleIds, id],
        }));
        return !has;
      },

      has: (id) => get().muscleIds.includes(id),
      clear: () => set({ muscleIds: [] }),
    }),
    {
      name: 'mf.collection',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ muscleIds: state.muscleIds }),
    },
  ),
);
