/* =========================================================================
   useNotesStore — eigene Notizen je Muskel (Etappe 8e).
   src/store/useNotesStore.ts

   Was die Dozentin im Unterricht sagt, steht in keinem Datensatz. Es muss dort
   hin, wo der Muskel steht — nicht in eine fremde App.

   Eigener Key `mf.notes`, additive optionale Backup-Sektion `notes` — dasselbe
   Muster wie `useLookupStore`/`useProfileStore`/`useStreakStore`: ältere Versionen
   ignorieren den Schlüssel, ADR 0002 bleibt unangetastet.

   Notizen hängen am **Muskel** (`nameLatin`, ADR 0002 §2), nicht an der Karte:
   Sie überleben, wenn eine Karte aus dem Kasten fliegt.
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createEmptyNotesSection } from '../persistence/sanitize';
import { MAX_NOTE_LENGTH, type NotesSection } from '../persistence/types';

interface NotesState {
  notes: NotesSection;

  /** Notiz eines Muskels — `''`, wenn keine da ist. */
  getNote: (nameLatin: string) => string;
  /**
   * Notiz setzen. **Leerer Text löscht die Notiz** — ein leerer Eintrag hätte im
   * Backup nichts zu suchen. Der Text wird getrimmt und gedeckelt.
   */
  setNote: (nameLatin: string, text: string, now?: Date) => void;

  /* Persistenz-Bridge (Backup-Import / Reset). */
  replaceNotes: (notes: NotesSection) => void;
  resetNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: createEmptyNotesSection(),

      getNote: (nameLatin) => get().notes.entries[nameLatin]?.text ?? '',

      setNote: (nameLatin, text, now = new Date()) => {
        const clean = text.trim().slice(0, MAX_NOTE_LENGTH);
        const current = get().notes.entries[nameLatin]?.text ?? '';
        if (clean === current) return;

        set((state) => {
          const entries = { ...state.notes.entries };
          if (clean === '') {
            delete entries[nameLatin];
          } else {
            entries[nameLatin] = { text: clean, updatedAt: now.toISOString() };
          }
          return { notes: { ...state.notes, entries } };
        });
      },

      replaceNotes: (notes) => set({ notes }),
      resetNotes: () => set({ notes: createEmptyNotesSection() }),
    }),
    {
      name: 'mf.notes',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes }),
    },
  ),
);
