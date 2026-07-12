/* =========================================================================
   Sanitizer — V1-Regeln 1:1 getypt portiert (aus V1 nav.js/progress.js).
   src/persistence/sanitize.ts

   Jede Sektion (flashcards/xp/quizSeries) wird beim Import wie beim Export
   durch dieselben Regeln gehärtet: geklammerte Fächer, nicht-negative Ints,
   `correct ≤ answers`, normalisierte Datums-Strings, gekürzte Historie.

   `strict` unterscheidet Import/Export (harte Fehler bei beschädigten Sektionen)
   von tolerantem Auffüllen fehlender Sektionen.
   ========================================================================= */

import {
  MAX_NOTE_LENGTH,
  type FlashcardCard,
  type FlashcardsSection,
  type LookupEntry,
  type LookupsSection,
  type NoteEntry,
  type NotesSection,
  type ProfileSection,
  type StreakSection,
  type QuizHistoryEntry,
  type QuizSeriesEntry,
  type QuizSeriesSection,
  type XpSection,
} from './types';

/** Wird bei ungültigem/abgelehntem Backup geworfen; trägt eine nutzerlesbare Meldung. */
export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

/** Maximale Anzahl gespeicherter Runden je Quiz-Serie (V1: HISTORY_LIMIT). */
export const QUIZ_HISTORY_LIMIT = 5;

export interface SanitizeOptions {
  /** true → beschädigte/ungültige Sektion wirft, statt still leer zu ersetzen. */
  strict?: boolean;
}

/* ---------- Typ-Guards & Zahl-/Datums-Primitive (V1-identisch) --------- */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Ganzzahl ≥ 0; NaN/Infinity → fallback (0). */
export function toNonNegativeInt(value: unknown, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

/** Ganzzahl in [min, max] geklammert; NaN/Infinity → fallback. */
export function toClampedInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number = Number.MAX_SAFE_INTEGER,
): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(num)));
}

/** String → ISO-Datum; unparsebar → fallback. */
export function toISODate(value: unknown, fallback: string): string {
  const ts = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  return Number.isNaN(ts) ? fallback : new Date(ts).toISOString();
}

/** Wie toISODate, aber `null`/`undefined` bleibt `null`; Unparsebares → `null`. */
export function toOptionalISODate(value: unknown): string | null {
  if (value == null) return null;
  const ts = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

/** Nur „YYYY-MM-DD"-Strings werden akzeptiert, sonst null. */
export function toOptionalDayStamp(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/* ---------- Leere Sektionen -------------------------------------------- */

export function createEmptyFlashcardsSection(): FlashcardsSection {
  return { version: 2, cards: {} };
}

export function createEmptyXpSection(): XpSection {
  return { version: 2, totalXP: 0, lastDailyBonus: null };
}

/* ---------- Flashcards -------------------------------------------------- */

export function sanitizeFlashcardCard(card: unknown): FlashcardCard {
  const c = isPlainObject(card) ? card : {};
  return {
    fach: toClampedInt(c.fach, 1, 1, 7),
    nextDue: toISODate(c.nextDue, new Date().toISOString()),
    totalCorrect: toNonNegativeInt(c.totalCorrect),
    totalWrong: toNonNegativeInt(c.totalWrong),
    lastSeen: toOptionalISODate(c.lastSeen),
    difficult: !!c.difficult,
  };
}

export function sanitizeFlashcards(data: unknown, options: SanitizeOptions = {}): FlashcardsSection {
  if (!isPlainObject(data)) {
    if (options.strict) throw new BackupFormatError('Ungültiges Lernkarten-Backup');
    return createEmptyFlashcardsSection();
  }

  const rawCards = isPlainObject(data.cards) ? data.cards : null;
  if (options.strict && rawCards == null) {
    throw new BackupFormatError('Ungültiges Lernkarten-Backup');
  }

  const cards: Record<string, FlashcardCard> = {};
  for (const [name, card] of Object.entries(rawCards ?? {})) {
    if (typeof name !== 'string' || name.trim() === '') continue;
    cards[name] = sanitizeFlashcardCard(card);
  }

  return { version: 2, cards };
}

/* ---------- XP --------------------------------------------------------- */

export function sanitizeXp(data: unknown, options: SanitizeOptions = {}): XpSection {
  if (!isPlainObject(data)) {
    if (options.strict) throw new BackupFormatError('Ungültiges XP-Backup');
    return createEmptyXpSection();
  }

  return {
    version: 2,
    totalXP: toNonNegativeInt(data.totalXP),
    lastDailyBonus: toOptionalDayStamp(data.lastDailyBonus),
  };
}

/* ---------- Quiz-Serien ------------------------------------------------- */

export function sanitizeQuizHistoryEntry(entry: unknown): QuizHistoryEntry {
  const e = isPlainObject(entry) ? entry : {};
  const answered = toNonNegativeInt(e.answered);
  const correct = Math.min(answered, toNonNegativeInt(e.correct));
  const fallbackPct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const pct = Math.min(100, toNonNegativeInt(e.pct ?? fallbackPct));
  return { pct, correct, answered };
}

export function sanitizeQuizSeriesEntry(stats: unknown): QuizSeriesEntry {
  if (!isPlainObject(stats)) {
    return { rounds: 0, answers: 0, correct: 0, history: [] };
  }

  const answers = toNonNegativeInt(stats.answers);
  const correct = Math.min(answers, toNonNegativeInt(stats.correct));

  return {
    rounds: toNonNegativeInt(stats.rounds),
    answers,
    correct,
    history: Array.isArray(stats.history)
      ? stats.history.map(sanitizeQuizHistoryEntry).slice(-QUIZ_HISTORY_LIMIT)
      : [],
  };
}

export function sanitizeQuizSeries(data: unknown, options: SanitizeOptions = {}): QuizSeriesSection {
  if (!isPlainObject(data)) {
    if (options.strict) throw new BackupFormatError('Ungültiges Quiz-Serien-Backup');
    return {};
  }

  const normalized: QuizSeriesSection = {};
  for (const [key, value] of Object.entries(data)) {
    // Unbekannte Modus-Keys bleiben verbatim erhalten (ADR 0002).
    if (typeof key !== 'string' || key.trim() === '') continue;
    normalized[key] = sanitizeQuizSeriesEntry(value);
  }

  return normalized;
}

/* ---------- Nachgeschlagen (7d) ----------------------------------------- */

export function createEmptyLookupsSection(): LookupsSection {
  return { version: 2, entries: {} };
}

export function sanitizeLookupEntry(entry: unknown): LookupEntry {
  const e = isPlainObject(entry) ? entry : {};
  return {
    // Ein Eintrag ohne Aufruf ergibt keinen Sinn — mindestens 1.
    count: Math.max(1, toNonNegativeInt(e.count, 1)),
    lastLookup: toISODate(e.lastLookup, new Date().toISOString()),
  };
}

/**
 * Nachschlage-Zähler härten. Nie `strict`: die Sektion ist optional (ADR 0002 §1),
 * ein fehlender oder kaputter Block darf einen sonst gültigen Import nicht scheitern
 * lassen — die Lernkarten sind das Wertvolle, die Zähler sind Komfort.
 */
export function sanitizeLookups(data: unknown): LookupsSection {
  if (!isPlainObject(data)) return createEmptyLookupsSection();

  const rawEntries = isPlainObject(data.entries) ? data.entries : {};
  const entries: Record<string, LookupEntry> = {};
  for (const [name, entry] of Object.entries(rawEntries)) {
    if (typeof name !== 'string' || name.trim() === '') continue;
    entries[name] = sanitizeLookupEntry(entry);
  }

  return { version: 2, entries };
}

/* ---------- Lernprofil (7c) --------------------------------------------- */

const PROFESSIONS = ['physio', 'ergo', 'logo'];

export function createEmptyProfileSection(): ProfileSection {
  return { version: 2, profession: null, examDate: null };
}

/**
 * Lernprofil härten. Nie `strict` — die Sektion ist optional und darf einen sonst
 * gültigen Import nicht scheitern lassen. Ein unbekannter Beruf wird verworfen statt
 * durchgereicht: die App würde sonst über einen Wert stolpern, den sie nicht kennt.
 */
export function sanitizeProfile(data: unknown): ProfileSection {
  if (!isPlainObject(data)) return createEmptyProfileSection();

  const profession =
    typeof data.profession === 'string' && PROFESSIONS.includes(data.profession)
      ? data.profession
      : null;

  return { version: 2, profession, examDate: toOptionalDayStamp(data.examDate) };
}

/* ---------- Tages-Streak (7f) ------------------------------------------- */

export function createEmptyStreakSection(): StreakSection {
  return {
    version: 2,
    current: 0,
    best: 0,
    lastCompletedDay: null,
    freezes: 0,
    day: null,
    reviewedToday: 0,
    earnedFreezeToday: false,
  };
}

/**
 * Streak härten. Nie `strict` (optionale Sektion). `best` kann nie kleiner als
 * `current` sein, und die Freeze-Zahl wird gedeckelt — sonst liesse sich der Streak
 * über eine handgeschriebene Backup-Datei beliebig aufblasen.
 */
export function sanitizeStreak(data: unknown, maxFreezes = 2): StreakSection {
  if (!isPlainObject(data)) return createEmptyStreakSection();

  const current = toNonNegativeInt(data.current);
  return {
    version: 2,
    current,
    best: Math.max(current, toNonNegativeInt(data.best)),
    lastCompletedDay: toOptionalDayStamp(data.lastCompletedDay),
    freezes: toClampedInt(data.freezes, 0, 0, maxFreezes),
    day: toOptionalDayStamp(data.day),
    reviewedToday: toNonNegativeInt(data.reviewedToday),
    earnedFreezeToday: !!data.earnedFreezeToday,
  };
}

/* ---------- Eigene Notizen (8e) ----------------------------------------- */

export function createEmptyNotesSection(): NotesSection {
  return { version: 2, entries: {} };
}

/**
 * Notizen härten. Nie `strict` (optionale Sektion, ADR 0002 §1): Eine kaputte Notiz
 * darf einen sonst gültigen Import nicht kippen — die Lernkarten sind das Wertvolle.
 *
 * Leere Notizen fallen raus (leere Notiz = keine Notiz), und der Text wird gedeckelt:
 * Eine handgeschriebene Datei soll den Speicher nicht sprengen können.
 */
export function sanitizeNotes(data: unknown): NotesSection {
  if (!isPlainObject(data)) return createEmptyNotesSection();

  const rawEntries = isPlainObject(data.entries) ? data.entries : {};
  const entries: Record<string, NoteEntry> = {};

  for (const [name, entry] of Object.entries(rawEntries)) {
    if (name.trim() === '' || !isPlainObject(entry)) continue;

    const text = typeof entry.text === 'string' ? entry.text.trim().slice(0, MAX_NOTE_LENGTH) : '';
    if (text === '') continue;

    entries[name] = { text, updatedAt: toISODate(entry.updatedAt, new Date().toISOString()) };
  }

  return { version: 2, entries };
}
