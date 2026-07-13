import { describe, expect, it } from 'vitest';
import {
  applyCorrect,
  applyUnsure,
  applyWrong,
  dueDate,
  FACH_INTERVALS,
  isDue,
  lapseFach,
  MASTERED_FACH,
  MAX_FACH,
  MIN_FACH,
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

  it('falsch → zurück, totalWrong++', () => {
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

/* Der Fehler, den diese Datei bis Etappe 12 NICHT gesehen hat: Der einzige Rückfall-Test
   oben startet in Fach 3 — und der landet unter BEIDEN Regeln bei 2. Die reifen Fächer,
   in denen der Fehler wehtat, waren schlicht nicht abgedeckt. */
describe('Eine vergessene Karte kommt bald wieder — nicht in 90 Tagen (Etappe 12)', () => {
  const now = new Date('2026-07-13T10:00:00');
  const karte = (fach: number): FlashcardCard => ({ ...newCard(now), fach });

  it('höchstens Fach 2 — aus JEDEM Fach', () => {
    expect(lapseFach(7)).toBe(2);
    expect(lapseFach(6)).toBe(2);
    expect(lapseFach(5)).toBe(2);
    expect(lapseFach(4)).toBe(2);
    expect(lapseFach(3)).toBe(2);
  });

  it('aber immer mindestens ein Fach runter — sonst wäre ein Fehler in Fach 2 folgenlos', () => {
    expect(lapseFach(2)).toBe(1);
    expect(lapseFach(1)).toBe(1);
  });

  it('DAS WAR DER FEHLER: sechsmal richtig, einmal vergessen → 3 Tage, nicht 90', () => {
    const vergessen = applyWrong(karte(MAX_FACH), now);
    expect(vergessen.fach).toBe(2);
    expect(daysFromLocalMidnight(vergessen.nextDue, now)).toBe(3);
    // Vorher: Fach 6 → FACH_INTERVALS[6] = 90 Tage.
    expect(daysFromLocalMidnight(vergessen.nextDue, now)).not.toBe(FACH_INTERVALS[6]);
  });

  it('auch aus dem „gemeisterten" Fach 5 — vorher waren es 14 Tage', () => {
    const vergessen = applyWrong(karte(MASTERED_FACH), now);
    expect(vergessen.fach).toBe(2);
    expect(daysFromLocalMidnight(vergessen.nextDue, now)).toBe(3);
  });

  it('der Aufstieg danach läuft ganz normal weiter — es ist keine Strafschleife', () => {
    let k = applyWrong(karte(MAX_FACH), now);
    expect(k.fach).toBe(2);
    for (const erwartet of [3, 4, 5, 6, 7]) {
      k = applyCorrect(k, now);
      expect(k.fach).toBe(erwartet);
    }
  });

  it('das Datenformat bleibt unangetastet: `fach` 1–7, `nextDue` ein ISO-Datum (ADR 0002)', () => {
    const k = applyWrong(karte(MAX_FACH), now);
    expect(k.fach).toBeGreaterThanOrEqual(MIN_FACH);
    expect(k.fach).toBeLessThanOrEqual(MAX_FACH);
    expect(Number.isNaN(Date.parse(k.nextDue))).toBe(false);
    expect(Object.keys(k).sort()).toEqual(Object.keys(newCard(now)).sort());
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
