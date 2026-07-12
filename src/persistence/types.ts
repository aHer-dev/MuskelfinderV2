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

/* ---------- Nachgeschlagen (Etappe 7d) ---------------------------------- */

/** Ein nachgeschlagener Muskel: wie oft, und wann zuletzt. */
export interface LookupEntry {
  /** Aufrufe der Detailseite, ≥ 1. */
  count: number;
  /** ISO-Datum des letzten Aufrufs. */
  lastLookup: string;
}

/**
 * Nachschlage-Zähler je Muskel. **Additive Sektion** (ADR 0002 §1): sie ist im
 * Backup OPTIONAL und fehlt in jeder Datei, die vor 7d geschrieben wurde. Ältere
 * Versionen (und V1) ignorieren den Schlüssel — die drei Pflicht-Sektionen sind
 * unverändert, die Backup-Version bleibt 2.
 */
export interface LookupsSection {
  version: 2;
  /** Schlüssel = lateinischer Muskelname, wie bei den Lernkarten (ADR 0002 §2). */
  entries: Record<string, LookupEntry>;
}

/* ---------- Lernprofil (Etappe 7c) -------------------------------------- */

/**
 * Beruf + Prüfungstermin. Wie `lookups` eine **additive, optionale** Sektion:
 * Sie fehlt in jeder Datei, die vor 7c/7d geschrieben wurde, und in jeder, deren
 * Nutzerin nie ein Profil gesetzt hat. Der Termin steuert die Tagesdosis — er ist
 * es wert, einen Gerätewechsel zu überleben.
 */
export interface ProfileSection {
  version: 2;
  /** 'physio' | 'ergo' | 'logo' — als String, damit die Persistenz nichts über die Domäne weiß. */
  profession: string | null;
  /** „YYYY-MM-DD" oder null (übersprungen). */
  examDate: string | null;
}

/* ---------- Tages-Streak (Etappe 7f) ------------------------------------ */

/**
 * Aufeinanderfolgende Tage mit erledigter Tagesdosis, plus verdiente Freezes.
 * Additive, optionale Sektion — wie `lookups`/`profile`. NICHT zu verwechseln mit
 * der Quiz-Antwortserie (`streakXp`), die nichts mit Tagen zu tun hat.
 */
export interface StreakSection {
  version: 2;
  /** Aufeinanderfolgende Tage mit erledigter Tagesdosis. */
  current: number;
  best: number;
  /** „YYYY-MM-DD" des letzten Tages mit erfüllter Dosis, oder null. */
  lastCompletedDay: string | null;
  freezes: number;
  /** Der Tag, auf den sich `reviewedToday` bezieht — sonst zählte man über Mitternacht weiter. */
  day: string | null;
  /** Heute bewertete Karten. */
  reviewedToday: number;
  /** Wurde heute schon ein Freeze verdient? (Max. einer pro Tag.) */
  earnedFreezeToday: boolean;
}

/* ---------- Eigene Notizen (Etappe 8e) ---------------------------------- */

/** Was die Dozentin im Unterricht gesagt hat — steht in keinem Datensatz. */
export interface NoteEntry {
  /** Freitext, nie leer: eine geleerte Notiz wird gelöscht, nicht als "" gespeichert. */
  text: string;
  /** ISO-Datum der letzten Änderung. */
  updatedAt: string;
}

/**
 * Notizen je Muskel. Wie `lookups`/`profile`/`streak` eine **additive, optionale**
 * Sektion (ADR 0002 §1): Sie fehlt in jeder Datei, die vor 8e geschrieben wurde,
 * ältere Versionen ignorieren sie, die Backup-Version bleibt 2.
 */
export interface NotesSection {
  version: 2;
  /** Schlüssel = lateinischer Muskelname (ADR 0002 §2), NICHT die Routing-id. */
  entries: Record<string, NoteEntry>;
}

/** Obergrenze je Notiz. Schützt den Speicher vor einer handgeschriebenen Datei. */
export const MAX_NOTE_LENGTH = 2000;

/* ---------- Backup-Datei ------------------------------------------------ */

export interface BackupFile {
  backupType: typeof BACKUP_TYPE;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  flashcards: FlashcardsSection;
  xp: XpSection;
  quizSeries: QuizSeriesSection;
  /** Fehlt, solange nichts nachgeschlagen wurde — dann bleibt die Datei byte-gleich zu vor 7d. */
  lookups?: LookupsSection;
  /** Fehlt, solange kein Profil gesetzt wurde. */
  profile?: ProfileSection;
  /** Fehlt, solange nie ein Tag abgeschlossen wurde. */
  streak?: StreakSection;
  /** Fehlt, solange keine Notiz geschrieben wurde. */
  notes?: NotesSection;
}

/** Die Sektionen, die Import → Store und Store → Export überträgt. */
export interface BackupSections {
  flashcards: FlashcardsSection;
  xp: XpSection;
  quizSeries: QuizSeriesSection;
  lookups?: LookupsSection;
  profile?: ProfileSection;
  streak?: StreakSection;
  notes?: NotesSection;
}

/** Ergebnis eines erfolgreichen Imports. Legacy-Backups liefern nur `flashcards`. */
export interface ImportResult {
  type: 'full-backup' | 'legacy-flashcards';
  sections: {
    flashcards: FlashcardsSection;
    xp?: XpSection;
    quizSeries?: QuizSeriesSection;
    lookups?: LookupsSection;
    profile?: ProfileSection;
    streak?: StreakSection;
    notes?: NotesSection;
  };
}
