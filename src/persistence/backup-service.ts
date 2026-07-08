/* =========================================================================
   Backup-Service — verbindet den reinen Backup-Adapter mit den Stores.
   src/persistence/backup-service.ts

   `exportBackup` liest den aktuellen Store-Zustand und baut die v2-Datei;
   `importBackup` parst eine Datei und schreibt ihre Sektionen zurück in die
   Stores. Legacy-Flashcard-Backups überschreiben NUR die Lernkarten und lassen
   XP/Quiz-Serien unangetastet (wie V1 persistSections).
   ========================================================================= */

import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { buildBackup, parseBackup } from './backup';
import type { BackupFile, ImportResult } from './types';

/** Aktuellen Store-Zustand als exportierbares v2-Backup einsammeln. */
export function exportBackup(exportedAt?: string): BackupFile {
  const { flashcards, xp } = useProgressStore.getState();
  const { quizSeries } = useQuizStore.getState();
  return buildBackup({ flashcards, xp, quizSeries }, exportedAt);
}

/** Backup parsen und in die Stores schreiben. Wirft `BackupFormatError` bei Ablehnung. */
export function importBackup(input: string | unknown): ImportResult {
  const result = parseBackup(input);
  const { flashcards, xp, quizSeries } = result.sections;

  if (flashcards) {
    // Legacy: xp fehlt → bestehenden XP-Stand behalten.
    const currentXp = useProgressStore.getState().xp;
    useProgressStore.getState().replaceProgress({ flashcards, xp: xp ?? currentXp });
  }
  if (quizSeries) {
    useQuizStore.getState().replaceQuizSeries(quizSeries);
  }

  return result;
}
