import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildBackup,
  normalizeLegacyFlashcardBackup,
  parseBackup,
  serializeBackup,
} from './backup';
import { BackupFormatError } from './sanitize';
import { BACKUP_TYPE, BACKUP_VERSION } from './types';

const FIXTURE_DIR = path.join(process.cwd(), 'src/persistence/__fixtures__');

function fixture(name: string): string {
  return readFileSync(path.join(FIXTURE_DIR, name), 'utf8');
}

describe('parseBackup — akzeptierte Formate', () => {
  it('nimmt ein vollständiges v2-Backup an', () => {
    const result = parseBackup(fixture('full-backup-v2.json'));
    expect(result.type).toBe('full-backup');
    expect(Object.keys(result.sections.flashcards.cards)).toContain('M. deltoideus');
    expect(result.sections.xp?.totalXP).toBe(553);
    expect(Object.keys(result.sections.quizSeries ?? {})).toHaveLength(2);
  });

  it('nimmt ein v1-Backup an (gleiche Sektionen, alte Nummer)', () => {
    const result = parseBackup(fixture('full-backup-v1.json'));
    expect(result.type).toBe('full-backup');
    expect(result.sections.xp?.totalXP).toBe(1910);
  });

  it('nimmt ein Legacy-Flashcard-only-Backup an (nur Karten)', () => {
    const result = parseBackup(fixture('legacy-flashcards.json'));
    expect(result.type).toBe('legacy-flashcards');
    expect(result.sections.xp).toBeUndefined();
    expect(result.sections.quizSeries).toBeUndefined();
    expect(Object.keys(result.sections.flashcards.cards)).toContain('M. trapezius');
  });

  it('reicht unbekannte quizSeries-Modus-Keys verbatim durch', () => {
    const result = parseBackup(fixture('full-backup-v2.json'));
    const keys = Object.keys(result.sections.quizSeries ?? {});
    expect(keys).toContain('multiple-choice::{"deckOnly":false,"regions":[],"subgroups":[]}');
  });
});

describe('parseBackup — abgelehnte Formate', () => {
  it('lehnt version > 2 mit klarer Meldung ab', () => {
    const tooNew = { backupType: BACKUP_TYPE, version: 3, flashcards: {}, xp: {}, quizSeries: {} };
    expect(() => parseBackup(tooNew)).toThrow(/neueren Version/);
  });

  it('lehnt fehlende Version ab', () => {
    const noVersion = { backupType: BACKUP_TYPE, flashcards: {}, xp: {}, quizSeries: {} };
    expect(() => parseBackup(noVersion)).toThrow(/Version fehlt/);
  });

  it('lehnt ein Full-Backup mit fehlender Pflicht-Sektion ab', () => {
    const missing = { backupType: BACKUP_TYPE, version: 2, flashcards: { cards: {} }, xp: {} };
    expect(() => parseBackup(missing)).toThrow(/unvollständig/);
  });

  it('lehnt unbekanntes Format ab', () => {
    expect(() => parseBackup({ foo: 'bar' })).toThrow(/Unbekanntes Backup-Format/);
    expect(() => parseBackup({ foo: 'bar' })).toThrow(BackupFormatError);
  });

  it('lehnt ungültiges JSON ab', () => {
    expect(() => parseBackup('{ not json')).toThrow(/kein gültiges JSON/);
  });
});

describe('normalizeLegacyFlashcardBackup', () => {
  it('gibt null zurück, wenn backupType vorhanden ist (kein Legacy)', () => {
    expect(normalizeLegacyFlashcardBackup({ backupType: BACKUP_TYPE, cards: {} })).toBeNull();
  });

  it('gibt null zurück, wenn keine cards vorhanden sind', () => {
    expect(normalizeLegacyFlashcardBackup({ version: 2 })).toBeNull();
  });
});

describe('buildBackup / serializeBackup', () => {
  it('erzeugt das eingefrorene v2-Format mit sanitisierten Sektionen', () => {
    const backup = buildBackup(
      {
        flashcards: { version: 2, cards: { 'M. soleus': sanitizeStub() } },
        xp: { version: 2, totalXP: 100, lastDailyBonus: null },
        quizSeries: {},
      },
      '2026-07-08T00:00:00.000Z',
    );
    expect(backup.backupType).toBe(BACKUP_TYPE);
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe('2026-07-08T00:00:00.000Z');
    expect(backup.flashcards.cards['M. soleus'].fach).toBe(1);
  });

  it('serialisiert round-trip-fähig als JSON', () => {
    const backup = buildBackup(
      { flashcards: { version: 2, cards: {} }, xp: { version: 2, totalXP: 0, lastDailyBonus: null }, quizSeries: {} },
      '2026-07-08T00:00:00.000Z',
    );
    expect(JSON.parse(serializeBackup(backup))).toEqual(backup);
  });
});

function sanitizeStub() {
  return {
    fach: 1,
    nextDue: '2026-07-08T00:00:00.000Z',
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}
