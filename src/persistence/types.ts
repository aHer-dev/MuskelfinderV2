/* =========================================================================
   Persistenz- & Kompatibilitätskern — getypte V1-kompatible Speicher-Formen
   src/persistence/types.ts

   Diese Typen bilden das EINGEFRORENE V1-Backup-Format ab (ADR 0002). Sie sind
   bewusst V1-nah (Karten nach Muskelname, 7 Fächer, quizSeries-Modus-Keys) und
   leben gekapselt in der Persistenzschicht. Das saubere Domänenmodell
   (`src/types`) bleibt davor unberührt; Selektoren der Stores mappen darauf.
   ========================================================================= */

/** Fester Diskriminator jeder Backup-Datei. */
export const BACKUP_TYPE = 'muskelfinder-backup' as const;
/** Version, die der Export schreibt. Import akzeptiert 1 UND 2. */
export const BACKUP_VERSION = 2 as const;

/* ---------- Lernkarten (Leitner) --------------------------------------- */

/** Eine Lernkarte, wie sie im Backup unter dem Muskelnamen liegt. */
export interface FlashcardCard {
  /** Leitner-Fach 1..7. */
  fach: number;
  /** ISO-Datum, wann die Karte wieder fällig ist. */
  nextDue: string;
  totalCorrect: number;
  totalWrong: number;
  /** ISO-Datum des letzten Sehens, oder null. */
  lastSeen: string | null;
  difficult: boolean;
}

export interface FlashcardsSection {
  version: 2;
  /** Schlüssel = lateinischer Muskelname (ADR 0002 §2), NICHT die Routing-id. */
  cards: Record<string, FlashcardCard>;
}

/* ---------- XP / Gamification ------------------------------------------ */

export interface XpSection {
  version: 2;
  totalXP: number;
  /** „YYYY-MM-DD" oder null. */
  lastDailyBonus: string | null;
}

/* ---------- Quiz-Serien-Statistik -------------------------------------- */

export interface QuizHistoryEntry {
  pct: number;
  correct: number;
  answered: number;
}

export interface QuizSeriesEntry {
  rounds: number;
  answers: number;
  correct: number;
  /** Chronologisch, maximal die jüngsten 5 Runden. */
  history: QuizHistoryEntry[];
}

/** Schlüssel = opaker Modus-Key (`"<quizType>::<filterSignatur>"`), verbatim erhalten. */
export type QuizSeriesSection = Record<string, QuizSeriesEntry>;

/* ---------- Backup-Datei ------------------------------------------------ */

export interface BackupFile {
  backupType: typeof BACKUP_TYPE;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  flashcards: FlashcardsSection;
  xp: XpSection;
  quizSeries: QuizSeriesSection;
}

/** Die drei Sektionen, die Import → Store und Store → Export überträgt. */
export interface BackupSections {
  flashcards: FlashcardsSection;
  xp: XpSection;
  quizSeries: QuizSeriesSection;
}

/** Ergebnis eines erfolgreichen Imports. Legacy-Backups liefern nur `flashcards`. */
export interface ImportResult {
  type: 'full-backup' | 'legacy-flashcards';
  sections: {
    flashcards: FlashcardsSection;
    xp?: XpSection;
    quizSeries?: QuizSeriesSection;
  };
}
