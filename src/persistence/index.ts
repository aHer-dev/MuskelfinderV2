/* =========================================================================
   Persistenz-Barrel — öffentliche API des Kompatibilitätskerns (ADR 0002).
   src/persistence/index.ts
   ========================================================================= */

export * from './types';
export {
  BackupFormatError,
  QUIZ_HISTORY_LIMIT,
  createEmptyFlashcardsSection,
  createEmptyXpSection,
  sanitizeFlashcardCard,
  sanitizeFlashcards,
  sanitizeQuizHistoryEntry,
  sanitizeQuizSeries,
  sanitizeQuizSeriesEntry,
  sanitizeXp,
} from './sanitize';
export {
  buildBackup,
  normalizeFullBackup,
  normalizeLegacyFlashcardBackup,
  parseBackup,
  serializeBackup,
} from './backup';
export { exportBackup, importBackup } from './backup-service';
export { backupFilename, downloadBackup } from './download';
export {
  applyCorrect,
  applyUnsure,
  applyWrong,
  dueDate,
  FACH_INTERVALS,
  isDue,
  MASTERED_FACH,
  MAX_FACH,
  MIN_FACH,
  newCard,
} from './leitner';
export {
  DAILY_BONUS_XP,
  flashcardXp,
  levelFromXP,
  MAX_LEVEL,
  MAX_LEVEL_XP,
  streakXp,
  xpForLevel,
  xpView,
  type XpView,
} from './xp';
