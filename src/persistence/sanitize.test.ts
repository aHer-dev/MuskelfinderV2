import { describe, expect, it } from 'vitest';
import {
  BackupFormatError,
  QUIZ_HISTORY_LIMIT,
  sanitizeFlashcardCard,
  sanitizeFlashcards,
  sanitizeQuizHistoryEntry,
  sanitizeQuizSeries,
  sanitizeQuizSeriesEntry,
  sanitizeXp,
  toClampedInt,
  toISODate,
  toNonNegativeInt,
  toOptionalDayStamp,
  toOptionalISODate,
} from './sanitize';

describe('Zahl-/Datums-Primitive', () => {
  it('toNonNegativeInt klemmt auf ganze Zahlen ≥ 0', () => {
    expect(toNonNegativeInt(-5)).toBe(0);
    expect(toNonNegativeInt(2.9)).toBe(2);
    expect(toNonNegativeInt('3')).toBe(3);
    expect(toNonNegativeInt(Number.NaN)).toBe(0);
    expect(toNonNegativeInt(Infinity)).toBe(0);
  });

  it('toClampedInt klemmt in [min, max] mit Fallback', () => {
    expect(toClampedInt(99, 1, 1, 7)).toBe(7);
    expect(toClampedInt(0, 1, 1, 7)).toBe(1);
    expect(toClampedInt('x', 1, 1, 7)).toBe(1);
    expect(toClampedInt(4, 1, 1, 7)).toBe(4);
  });

  it('toISODate normalisiert gültige Strings, sonst Fallback', () => {
    expect(toISODate('2026-07-08T00:00:00.000Z', 'FB')).toBe('2026-07-08T00:00:00.000Z');
    expect(toISODate('kein-datum', 'FB')).toBe('FB');
    expect(toISODate(42, 'FB')).toBe('FB');
  });

  it('toOptionalISODate erhält null, verwirft Ungültiges', () => {
    expect(toOptionalISODate(null)).toBeNull();
    expect(toOptionalISODate(undefined)).toBeNull();
    expect(toOptionalISODate('kein-datum')).toBeNull();
    expect(toOptionalISODate('2026-07-08T00:00:00.000Z')).toBe('2026-07-08T00:00:00.000Z');
  });

  it('toOptionalDayStamp akzeptiert nur YYYY-MM-DD', () => {
    expect(toOptionalDayStamp('2026-07-08')).toBe('2026-07-08');
    expect(toOptionalDayStamp('07-2026')).toBeNull();
    expect(toOptionalDayStamp(20260708)).toBeNull();
  });
});

describe('sanitizeFlashcardCard', () => {
  it('klemmt fach auf 1..7, erzwingt Ints ≥ 0, difficult wird boolean', () => {
    const card = sanitizeFlashcardCard({
      fach: 99,
      nextDue: '2026-07-08T00:00:00.000Z',
      totalCorrect: -3,
      totalWrong: 2.9,
      lastSeen: 'garbage',
      difficult: 1,
    });
    expect(card.fach).toBe(7);
    expect(card.totalCorrect).toBe(0);
    expect(card.totalWrong).toBe(2);
    expect(card.lastSeen).toBeNull();
    expect(card.difficult).toBe(true);
  });
});

describe('sanitizeFlashcards', () => {
  it('überspringt leere/whitespace-Schlüssel', () => {
    const out = sanitizeFlashcards({
      version: 2,
      cards: { 'M. deltoideus': { fach: 2 }, '': { fach: 3 }, '   ': { fach: 4 } },
    });
    expect(Object.keys(out.cards)).toEqual(['M. deltoideus']);
    expect(out.cards['M. deltoideus'].fach).toBe(2);
  });

  it('strict wirft bei Nicht-Objekt oder fehlender cards-Sektion', () => {
    expect(() => sanitizeFlashcards(null, { strict: true })).toThrow(BackupFormatError);
    expect(() => sanitizeFlashcards({ version: 2 }, { strict: true })).toThrow(BackupFormatError);
  });

  it('tolerant liefert leere Sektion statt zu werfen', () => {
    expect(sanitizeFlashcards(null)).toEqual({ version: 2, cards: {} });
  });
});

describe('sanitizeXp', () => {
  it('erzwingt totalXP ≥ 0 und validiert den Tagesstempel', () => {
    expect(sanitizeXp({ totalXP: -10, lastDailyBonus: '07-2026' })).toEqual({
      version: 2,
      totalXP: 0,
      lastDailyBonus: null,
    });
  });

  it('strict wirft bei Nicht-Objekt', () => {
    expect(() => sanitizeXp(42, { strict: true })).toThrow(BackupFormatError);
  });
});

describe('sanitizeQuizSeries', () => {
  it('history-Eintrag: pct ≤ 100, correct ≤ answered, Fallback-pct', () => {
    expect(sanitizeQuizHistoryEntry({ pct: 200, correct: 10, answered: 4 })).toEqual({
      pct: 100,
      correct: 4,
      answered: 4,
    });
    expect(sanitizeQuizHistoryEntry({ correct: 3, answered: 4 })).toEqual({
      pct: 75,
      correct: 3,
      answered: 4,
    });
  });

  it('Serien-Eintrag: correct ≤ answers, history auf letzte 5 gekürzt', () => {
    const entry = sanitizeQuizSeriesEntry({
      rounds: -1,
      answers: 5,
      correct: 99,
      history: Array.from({ length: 6 }, (_, i) => ({ pct: i * 10, correct: 1, answered: 4 })),
    });
    expect(entry.rounds).toBe(0);
    expect(entry.correct).toBe(5);
    expect(entry.history).toHaveLength(QUIZ_HISTORY_LIMIT);
    // Der erste (älteste) Eintrag pct:0 wurde abgeschnitten.
    expect(entry.history[0].pct).toBe(10);
  });

  it('erhält unbekannte Modus-Keys verbatim', () => {
    const weird = 'custom-mode::{"deckOnly":true}';
    const out = sanitizeQuizSeries({ [weird]: { rounds: 1, answers: 2, correct: 1, history: [] } });
    expect(Object.keys(out)).toEqual([weird]);
  });

  it('überspringt leere Keys und wirft strict bei Nicht-Objekt', () => {
    expect(Object.keys(sanitizeQuizSeries({ '': { rounds: 1 } }))).toEqual([]);
    expect(() => sanitizeQuizSeries(null, { strict: true })).toThrow(BackupFormatError);
  });
});
