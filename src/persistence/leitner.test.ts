import { describe, expect, it } from 'vitest';
import {
  applyCorrect,
  applyUnsure,
  applyWrong,
  dueDate,
  FACH_INTERVALS,
  isDue,
  newCard,
} from './leitner';
import type { FlashcardCard } from './types';

/** Tages-Differenz zwischen zwei ISO-Daten, relativ zu lokaler Mitternacht von `now`. */
function daysFromLocalMidnight(iso: string, now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso).getTime() - midnight.getTime()) / 86_400_000);
}

describe('Leitner-Intervalle', () => {
  it('entsprechen 1/3/7/14/30/90/180 Tagen', () => {
    expect([...FACH_INTERVALS]).toEqual([0, 1, 3, 7, 14, 30, 90, 180]);
  });

  it('dueDate setzt die Fälligkeit um das Fach-Intervall in die Zukunft', () => {
    const now = new Date('2026-07-08T10:00:00');
    expect(daysFromLocalMidnight(dueDate(1, now), now)).toBe(1);
    expect(daysFromLocalMidnight(dueDate(3, now), now)).toBe(7);
    expect(daysFromLocalMidnight(dueDate(5, now), now)).toBe(30);
    expect(daysFromLocalMidnight(dueDate(7, now), now)).toBe(180);
  });
});

describe('newCard', () => {
  it('startet in Fach 1, sofort fällig, ohne Historie', () => {
    const card = newCard(new Date('2026-07-08T10:00:00Z'));
    expect(card.fach).toBe(1);
    expect(card.totalCorrect).toBe(0);
    expect(card.totalWrong).toBe(0);
    expect(card.lastSeen).toBeNull();
    expect(card.difficult).toBe(false);
  });
});

describe('Bewertungs-Transitions', () => {
  const base: FlashcardCard = {
    fach: 3,
    nextDue: '2026-07-08T00:00:00.000Z',
    totalCorrect: 4,
    totalWrong: 2,
    lastSeen: null,
    difficult: false,
  };

  it('richtig → ein Fach hoch, totalCorrect++, lastSeen gesetzt', () => {
    const next = applyCorrect(base, new Date('2026-07-08T10:00:00'));
    expect(next.fach).toBe(4);
    expect(next.totalCorrect).toBe(5);
    expect(next.totalWrong).toBe(2);
    expect(next.lastSeen).not.toBeNull();
  });

  it('richtig in Fach 7 bleibt bei 7 (Deckel)', () => {
    expect(applyCorrect({ ...base, fach: 7 }).fach).toBe(7);
  });

  it('falsch → ein Fach zurück, totalWrong++', () => {
    const next = applyWrong(base);
    expect(next.fach).toBe(2);
    expect(next.totalWrong).toBe(3);
    expect(next.totalCorrect).toBe(4);
  });

  it('falsch in Fach 1 bleibt bei 1 (Boden)', () => {
    expect(applyWrong({ ...base, fach: 1 }).fach).toBe(1);
  });

  it('unsicher → Fach & Fälligkeit unverändert, nur lastSeen', () => {
    const next = applyUnsure(base);
    expect(next.fach).toBe(3);
    expect(next.nextDue).toBe(base.nextDue);
    expect(next.lastSeen).not.toBeNull();
  });
});

describe('isDue', () => {
  const now = new Date('2026-07-08T10:00:00Z');

  it('fällig, wenn nextDue in der Vergangenheit liegt', () => {
    expect(isDue({ ...newCard(now), nextDue: '2026-07-01T00:00:00.000Z' }, now)).toBe(true);
  });

  it('nicht fällig, wenn nextDue in der Zukunft liegt', () => {
    expect(isDue({ ...newCard(now), nextDue: '2026-08-01T00:00:00.000Z' }, now)).toBe(false);
  });

  it('schwierige Karten sind immer fällig, unabhängig vom Intervall', () => {
    expect(
      isDue({ ...newCard(now), nextDue: '2026-08-01T00:00:00.000Z', difficult: true }, now),
    ).toBe(true);
  });
});
