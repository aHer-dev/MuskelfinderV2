/* =========================================================================
   useProfileStore — Lernprofil: Beruf + Prüfungstermin (Etappe 7c).
   src/store/useProfileStore.ts

   Reines V2-Konzept: eigener Key `mf.profile`. Seit der Entscheidung vom 2026-07-12
   liegt das Profil **auch im Backup** — als additive, optionale Sektion (`profile`),
   nach demselben Muster wie `lookups` (7d): Sie fehlt in der Datei, solange kein
   Profil gesetzt ist, ältere Versionen ignorieren den Schlüssel, die Backup-Version
   bleibt 2. Grund: Der Prüfungstermin steuert die Tagesdosis — ein Gerätewechsel
   soll ihn nicht verlieren. Die drei Pflicht-Sektionen bleiben unangetastet
   (ADR 0002 §1).
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profession } from '../data/profession';
import type { ProfileSection } from '../persistence/types';

interface ProfileState {
  /** null = noch nie beantwortet → Erststart (das Onboarding fragt). */
  profession: Profession | null;
  /** „YYYY-MM-DD" oder null (übersprungen). Speist die Tagesdosis in `data/today.ts`. */
  examDate: string | null;

  setProfile: (profession: Profession, examDate: string | null) => void;
  resetProfile: () => void;

  /* Persistenz-Bridge (Backup-Import/Export) — additive, optionale Sektion. */
  toSection: () => ProfileSection;
  replaceProfile: (section: ProfileSection) => void;
}

/** Die Persistenz kennt die Domäne nicht — hier wird der Beruf wieder eingeengt. */
function toProfession(value: string | null): Profession | null {
  return value === 'physio' || value === 'ergo' || value === 'logo' ? value : null;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profession: null,
      examDate: null,

      setProfile: (profession, examDate) => set({ profession, examDate: examDate || null }),
      resetProfile: () => set({ profession: null, examDate: null }),

      toSection: () => ({
        version: 2,
        profession: get().profession,
        examDate: get().examDate,
      }),

      replaceProfile: ({ profession, examDate }) =>
        set({ profession: toProfession(profession), examDate }),
    }),
    {
      name: 'mf.profile',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profession: state.profession, examDate: state.examDate }),
    },
  ),
);
