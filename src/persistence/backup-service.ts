/* =========================================================================
   Backup-Service — verbindet den reinen Backup-Adapter mit den Stores.
   src/persistence/backup-service.ts

   `exportBackup` liest den aktuellen Store-Zustand und baut die v2-Datei;
   `importBackup` parst eine Datei und schreibt ihre Sektionen zurück in die
   Stores. Legacy-Flashcard-Backups überschreiben NUR die Lernkarten und lassen
   XP/Quiz-Serien unangetastet (wie V1 persistSections).
   ========================================================================= */

import { useLookupStore } from '../store/useLookupStore';
import { useNotesStore } from '../store/useNotesStore';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { useStreakStore } from '../store/useStreakStore';
import { buildBackup, parseBackup } from './backup';
import type { BackupFile, ImportResult } from './types';

/** Aktuellen Store-Zustand als exportierbares v2-Backup einsammeln. */
export function exportBackup(exportedAt?: string): BackupFile {
  const { flashcards, xp } = useProgressStore.getState();
  const { quizSeries } = useQuizStore.getState();
  const { lookups } = useLookupStore.getState();
  const profile = useProfileStore.getState().toSection();
  const { streak } = useStreakStore.getState();
  const { notes } = useNotesStore.getState();
  return buildBackup({ flashcards, xp, quizSeries, lookups, profile, streak, notes }, exportedAt);
}

/** Backup parsen und in die Stores schreiben. Wirft `BackupFormatError` bei Ablehnung. */
export function importBackup(input: string | unknown): ImportResult {
  const result = parseBackup(input);
  const { flashcards, xp, quizSeries, lookups, profile, streak, notes } = result.sections;

  if (flashcards) {
    // Legacy: xp fehlt → bestehenden XP-Stand behalten.
    const currentXp = useProgressStore.getState().xp;
    useProgressStore.getState().replaceProgress({ flashcards, xp: xp ?? currentXp });
  }
  if (quizSeries) {
    useQuizStore.getState().replaceQuizSeries(quizSeries);
  }
  // Fehlt die additive Sektion (jedes Backup vor 7d), bleiben die lokalen Zähler stehen —
  // ein alter Import darf ein Lückenprotokoll nicht stillschweigend löschen.
  if (lookups) {
    useLookupStore.getState().replaceLookups(lookups);
  }
  if (profile) {
    useProfileStore.getState().replaceProfile(profile);
  }
  if (streak) {
    useStreakStore.getState().replaceStreak(streak);
  }
  // Ein Backup von vor 8e traegt keine Notizen — es darf die vorhandenen nicht loeschen.
  if (notes) {
    useNotesStore.getState().replaceNotes(notes);
  }

  return result;
}
