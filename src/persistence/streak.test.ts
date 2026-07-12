import { describe, expect, it } from 'vitest';
import { MAX_FREEZES, dayStamp, daysBetween, recordReview, rollOverStreak } from './streak';
import { createEmptyStreakSection } from './sanitize';
import type { StreakSection } from './types';

const DOSE = 20;

/** Lokale Zeit — der Streak rechnet bewusst im Tag der Nutzerin, nicht in UTC. */
function at(day: string, hour = 10): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour);
}

function streak(overrides: Partial<StreakSection> = {}): StreakSection {
  return { ...createEmptyStreakSection(), ...overrides };
}

/** `n` Karten an einem Tag bewerten. */
function reviewMany(start: StreakSection, n: number, day: string, dose = DOSE) {
  let state = start;
  let completed = 0;
  let freezes = 0;
  for (let i = 0; i < n; i++) {
    const result = recordReview(state, dose, at(day));
    state = result.streak;
    if (result.completedToday) completed++;
    if (result.earnedFreeze) freezes++;
  }
  return { state, completed, freezes };
}

describe('Tagesgrenzen', () => {
  it('dayStamp arbeitet lokal, nicht in UTC', () => {
    // 23:30 Ortszeit ist noch derselbe Tag — in UTC wäre es (je nach Zone) schon der nächste.
    expect(dayStamp(at('2026-07-12', 23))).toBe('2026-07-12');
    expect(dayStamp(at('2026-07-12', 0))).toBe('2026-07-12');
  });

  it('daysBetween zählt ganze Tage und wird negativ bei Rückwärtssprung', () => {
    expect(daysBetween('2026-07-10', '2026-07-12')).toBe(2);
    expect(daysBetween('2026-07-12', '2026-07-12')).toBe(0);
    expect(daysBetween('2026-07-12', '2026-07-10')).toBe(-2);
    // Über den Monatswechsel.
    expect(daysBetween('2026-07-31', '2026-08-01')).toBe(1);
  });
});

describe('recordReview — der Streak wächst mit der Tagesdosis', () => {
  it('zählt einen Tag erst, wenn die Dosis voll ist', () => {
    const { state, completed } = reviewMany(streak(), DOSE - 1, '2026-07-12');

    expect(completed).toBe(0);
    expect(state.current).toBe(0);
    expect(state.reviewedToday).toBe(DOSE - 1);
  });

  it('zählt den Tag genau EINMAL, auch wenn danach weitergelernt wird', () => {
    const { state, completed } = reviewMany(streak(), DOSE + 15, '2026-07-12');

    expect(completed).toBe(1);
    expect(state.current).toBe(1);
    expect(state.best).toBe(1);
    expect(state.lastCompletedDay).toBe('2026-07-12');
  });

  it('aufeinanderfolgende Tage summieren sich', () => {
    let state = reviewMany(streak(), DOSE, '2026-07-10').state;
    state = rollOverStreak(state, at('2026-07-11')).streak;
    state = reviewMany(state, DOSE, '2026-07-11').state;
    state = rollOverStreak(state, at('2026-07-12')).streak;
    state = reviewMany(state, DOSE, '2026-07-12').state;

    expect(state.current).toBe(3);
    expect(state.best).toBe(3);
  });

  it('der Tageszähler beginnt über Mitternacht bei null', () => {
    const day1 = reviewMany(streak(), 5, '2026-07-12').state;
    expect(day1.reviewedToday).toBe(5);

    const day2 = recordReview(day1, DOSE, at('2026-07-13')).streak;
    expect(day2.reviewedToday).toBe(1);
    expect(day2.day).toBe('2026-07-13');
  });
});

describe('Freeze — verdient durch Überperformen, nie gekauft', () => {
  it('das Doppelte der Tagesdosis verdient genau einen Freeze', () => {
    const { state, freezes } = reviewMany(streak(), DOSE * 2, '2026-07-12');

    expect(freezes).toBe(1);
    expect(state.freezes).toBe(1);
  });

  it('noch mehr Lernen am selben Tag bringt keinen zweiten Freeze', () => {
    const { state, freezes } = reviewMany(streak(), DOSE * 5, '2026-07-12');

    expect(freezes).toBe(1);
    expect(state.freezes).toBe(1);
  });

  it('ist gedeckelt — Vorsprung lässt sich nicht horten', () => {
    let state = streak({ freezes: MAX_FREEZES });
    state = reviewMany(state, DOSE * 2, '2026-07-12').state;

    expect(state.freezes).toBe(MAX_FREEZES);
  });
});

describe('rollOverStreak — ein Fehltag ist nicht das Ende', () => {
  it('Normalfall: gestern gelernt, heute geöffnet → nichts passiert', () => {
    const state = streak({ current: 3, lastCompletedDay: '2026-07-11' });
    const result = rollOverStreak(state, at('2026-07-12'));

    expect(result.event).toBe('none');
    expect(result.streak.current).toBe(3);
  });

  it('Fehltag MIT Freeze: automatisch überbrückt, ohne Nachfrage', () => {
    const state = streak({ current: 5, lastCompletedDay: '2026-07-10', freezes: 1 });
    const result = rollOverStreak(state, at('2026-07-12')); // der 11. fehlt

    expect(result.event).toBe('freeze-used');
    expect(result.freezesUsed).toBe(1);
    expect(result.streak.current).toBe(5); // Serie steht
    expect(result.streak.freezes).toBe(0); // Freeze verbraucht
  });

  it('Fehltag OHNE Freeze: Serie beginnt neu — und die Bestmarke bleibt', () => {
    const state = streak({ current: 5, best: 5, lastCompletedDay: '2026-07-10', freezes: 0 });
    const result = rollOverStreak(state, at('2026-07-12'));

    expect(result.event).toBe('reset');
    expect(result.streak.current).toBe(0);
    expect(result.streak.best).toBe(5);
  });

  it('mehrere Fehltage: jeder kostet einen Freeze', () => {
    const state = streak({ current: 9, lastCompletedDay: '2026-07-09', freezes: 2 });
    const result = rollOverStreak(state, at('2026-07-12')); // 10. und 11. fehlen

    expect(result.event).toBe('freeze-used');
    expect(result.freezesUsed).toBe(2);
    expect(result.streak.current).toBe(9);
    expect(result.streak.freezes).toBe(0);
  });

  it('mehr Fehltage als Freezes: Serie reißt, die verdienten Freezes bleiben aber liegen', () => {
    const state = streak({ current: 9, lastCompletedDay: '2026-07-05', freezes: 1 });
    const result = rollOverStreak(state, at('2026-07-12'));

    expect(result.event).toBe('reset');
    expect(result.streak.current).toBe(0);
    // Ein Entzug wäre eine Strafe — sie hat den Freeze verdient.
    expect(result.streak.freezes).toBe(1);
  });

  it('nach dem Freeze zählt der nächste erfüllte Tag normal weiter', () => {
    let state = streak({ current: 5, lastCompletedDay: '2026-07-10', freezes: 1 });
    state = rollOverStreak(state, at('2026-07-12')).streak;
    state = reviewMany(state, DOSE, '2026-07-12').state;

    expect(state.current).toBe(6);
    expect(state.lastCompletedDay).toBe('2026-07-12');
  });

  it('Uhr zurückgedreht: der Streak wird weder aufgebläht noch zerstört', () => {
    const state = streak({ current: 4, best: 4, lastCompletedDay: '2026-07-12', freezes: 1 });
    const result = rollOverStreak(state, at('2026-07-01')); // Datum in der Vergangenheit

    expect(result.event).toBe('none');
    expect(result.streak.current).toBe(4);
    expect(result.streak.freezes).toBe(1);
    expect(result.streak.lastCompletedDay).toBe('2026-07-12');
  });

  it('wer nie gelernt hat, verliert auch nichts', () => {
    const result = rollOverStreak(createEmptyStreakSection(), at('2026-07-12'));

    expect(result.event).toBe('none');
    expect(result.streak.current).toBe(0);
  });
});
