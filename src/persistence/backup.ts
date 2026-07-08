/* =========================================================================
   Backup-Adapter — Import/Export des eingefrorenen V1-Formats (ADR 0002 §1).
   src/persistence/backup.ts

   Reine, DOM-freie Logik: `parseBackup` normalisiert eingehende Dateien
   (v1, v2, Legacy-Flashcard-only) und lehnt Unbekanntes/zu Neues ab;
   `buildBackup` erzeugt das exportierbare v2-Format. Die Verdrahtung mit den
   Stores liegt in `backup-service.ts`, der Download in `download.ts`.
   ========================================================================= */

import {
  BackupFormatError,
  hasOwn,
  isPlainObject,
  sanitizeFlashcards,
  sanitizeQuizSeries,
  sanitizeXp,
  toNonNegativeInt,
} from './sanitize';
import {
  BACKUP_TYPE,
  BACKUP_VERSION,
  type BackupFile,
  type BackupSections,
  type ImportResult,
} from './types';

const REQUIRED_SECTIONS = ['flashcards', 'xp', 'quizSeries'] as const;

/**
 * Legacy-Backup: Objekt OHNE `backupType`, aber mit `cards` → nur Lernkarten.
 * Gibt `null` zurück, wenn das Format nicht passt (dann Full-Backup versuchen).
 */
export function normalizeLegacyFlashcardBackup(parsed: unknown): ImportResult | null {
  if (!isPlainObject(parsed) || parsed.backupType || !isPlainObject(parsed.cards)) {
    return null;
  }
  return {
    type: 'legacy-flashcards',
    sections: { flashcards: sanitizeFlashcards(parsed, { strict: true }) },
  };
}

/** Vollständiges Backup (v1 oder v2). Wirft bei jedem Vertragsbruch. */
export function normalizeFullBackup(parsed: unknown): ImportResult {
  if (!isPlainObject(parsed) || parsed.backupType !== BACKUP_TYPE) {
    throw new BackupFormatError('Unbekanntes Backup-Format');
  }

  const version = toNonNegativeInt(parsed.version);
  if (version === 0) {
    throw new BackupFormatError('Backup-Version fehlt oder ist ungültig');
  }
  if (version > BACKUP_VERSION) {
    throw new BackupFormatError(
      'Dieses Backup stammt aus einer neueren Version und kann hier nicht sicher importiert werden.',
    );
  }
  if (![1, 2].includes(version)) {
    throw new BackupFormatError('Nicht unterstützte Backup-Version');
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!hasOwn(parsed, section)) {
      throw new BackupFormatError(`Backup unvollständig: "${section}" fehlt.`);
    }
  }

  return {
    type: 'full-backup',
    sections: {
      flashcards: sanitizeFlashcards(parsed.flashcards, { strict: true }),
      xp: sanitizeXp(parsed.xp, { strict: true }),
      quizSeries: sanitizeQuizSeries(parsed.quizSeries, { strict: true }),
    },
  };
}

/**
 * Einstieg: JSON-String oder bereits geparstes Objekt → normalisiertes Ergebnis.
 * Reihenfolge wie V1: erst Legacy prüfen, sonst Full-Backup (das dann wirft).
 */
export function parseBackup(input: string | unknown): ImportResult {
  let parsed: unknown;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new BackupFormatError('Backup-Datei ist kein gültiges JSON.');
    }
  } else {
    parsed = input;
  }

  const legacy = normalizeLegacyFlashcardBackup(parsed);
  return legacy ?? normalizeFullBackup(parsed);
}

/** Erzeugt das exportierbare v2-Backup-Objekt aus den (bereits getypten) Sektionen. */
export function buildBackup(
  sections: BackupSections,
  exportedAt: string = new Date().toISOString(),
): BackupFile {
  return {
    backupType: BACKUP_TYPE,
    version: BACKUP_VERSION,
    exportedAt,
    flashcards: sanitizeFlashcards(sections.flashcards, { strict: true }),
    xp: sanitizeXp(sections.xp, { strict: true }),
    quizSeries: sanitizeQuizSeries(sections.quizSeries, { strict: true }),
  };
}

/** Serialisiert ein Backup-Objekt als hübsch eingerücktes JSON (2 Spaces, wie V1). */
export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}
