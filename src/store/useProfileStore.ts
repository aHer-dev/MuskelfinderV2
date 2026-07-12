/* =========================================================================
   useProfileStore — Lernprofil: Beruf + Prüfungstermin (Etappe 7c).
   src/store/useProfileStore.ts

   Reines V2-Konzept, wie `useCollectionStore`: eigener Key `mf.profile`, KEINE
   Backup-Bridge. Das V1-Backup-Format kennt nur `flashcards`/`xp`/`quizSeries`
   und ist eingefroren (ADR 0002 §1) — ein neuer Abschnitt dort brächte nichts,
   das der Nutzerin in 15 Sekunden nicht wieder erzählt wäre, würde aber den
   Round-Trip-Vertrag gegen die V1-Fixtures anfassen. Additiv heißt hier: daneben,
   nicht hinein.
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profession } from '../data/seeding';

interface ProfileState {
  /** null = noch nie beantwortet → Erststart (das Onboarding fragt). */
  profession: Profession | null;
  /** „YYYY-MM-DD" oder null (übersprungen). Speist die Tagesdosis in `data/today.ts`. */
  examDate: string | null;

  setProfile: (profession: Profession, examDate: string | null) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profession: null,
      examDate: null,

      setProfile: (profession, examDate) => set({ profession, examDate: examDate || null }),
      resetProfile: () => set({ profession: null, examDate: null }),
    }),
    {
      name: 'mf.profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profession: state.profession, examDate: state.examDate }),
    },
  ),
);
