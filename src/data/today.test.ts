import { describe, expect, it } from 'vitest';
import {
  dailyDose,
  daysOverdue,
  daysUntilExam,
  DEFAULT_DAILY_DOSE,
  estimateMinutes,
  getTodayPlan,
  MAX_DAILY_DOSE,
  NEW_SUGGESTION_COUNT,
} from './today';
import type { FlashcardCard } from '../persistence/types';
import type { Difficulty, Muscle, RegionId } from '../types';

const NOW = new Date('2026-07-12T10:00:00.000Z');

/** Minimaler Muskel — nur die Felder, die die Engine liest, sind bedeutungsvoll. */
function muscle(nameLatin: string, region: RegionId, difficulty: Difficulty = 2): Muscle {
  return {
    id: nameLatin.toLowerCase().replace(/[^a-z]+/g, '-'),
    nameLatin,
    region,
    subregion: '',
    joints: [],
    origin: '',
    insertion: '',
    functions: [],
    functionDescription: '',
    innervation: '',
    segments: '',
    difficulty,
    images: [],
    tags: [],
  };
}

/** `dueInDays` negativ = überfällig, positiv = später fällig. */
function card(opts: Partial<FlashcardCard> & { dueInDays?: number } = {}): FlashcardCard {
  const { dueInDays = 0, ...rest } = opts;
  const due = new Date(NOW);
  due.setDate(due.getDate() + dueInDays);
  due.setHours(0, 0, 0, 0);
  return {
    fach: 1,
    nextDue: due.toISOString(),
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
    ...rest,
  };
}

const MUSCLES: Muscle[] = [
  muscle('M. deltoideus', 'upper', 1),
  muscle('M. biceps brachii', 'upper', 2),
  muscle('M. triceps brachii', 'upper', 3),
  muscle('M. gluteus maximus', 'lower', 1),
  muscle('M. rectus femoris', 'lower', 2),
  muscle('M. rectus abdominis', 'trunk', 1),
  muscle('M. masseter', 'head', 3),
];

function plan(input: Parameters<typeof getTodayPlan>[0]) {
  return getTodayPlan({ muscles: MUSCLES, now: NOW, ...input });
}

describe('daysOverdue', () => {
  it('zählt volle Tage Verzug und wird nie negativ', () => {
    expect(daysOverdue(card({ dueInDays: -3 }), NOW)).toBe(3);
    expect(daysOverdue(card({ dueInDays: 0 }), NOW)).toBe(0);
    expect(daysOverdue(card({ dueInDays: 5 }), NOW)).toBe(0);
  });
});

describe('daysUntilExam', () => {
  it('rechnet in Tagen; ohne, mit ungültigem oder vergangenem Datum null', () => {
    expect(daysUntilExam('2026-07-22T00:00:00.000Z', NOW)).toBe(10);
    expect(daysUntilExam(null, NOW)).toBeNull();
    expect(daysUntilExam('kein Datum', NOW)).toBeNull();
    expect(daysUntilExam('2026-07-01T00:00:00.000Z', NOW)).toBeNull();
  });
});

describe('dailyDose', () => {
  it('wächst, je näher die Prüfung rückt, und bleibt gedeckelt', () => {
    expect(dailyDose(null)).toBe(DEFAULT_DAILY_DOSE);
    expect(dailyDose(60)).toBe(DEFAULT_DAILY_DOSE);
    expect(dailyDose(20)).toBe(25);
    expect(dailyDose(10)).toBe(30);
    expect(dailyDose(3)).toBe(MAX_DAILY_DOSE);
  });
});

describe('estimateMinutes', () => {
  it('schätzt aufgerundet, mindestens eine Minute ab einer Karte', () => {
    expect(estimateMinutes(0)).toBe(0);
    expect(estimateMinutes(1)).toBe(1);
    expect(estimateMinutes(30)).toBe(10);
  });
});

describe('getTodayPlan — die vier Zustände', () => {
  it('1. Normalfall: fällige Karten werden ausgespielt', () => {
    const result = plan({
      cards: {
        'M. deltoideus': card({ dueInDays: -1 }),
        'M. biceps brachii': card({ dueInDays: 0 }),
        'M. masseter': card({ dueInDays: 7 }),
      },
    });

    expect(result.kind).toBe('review');
    expect(result.dueTotal).toBe(2);
    expect(result.dueCards).toHaveLength(2);
    expect(result.dueCards).not.toContain('M. masseter');
    expect(result.estimatedMinutes).toBeGreaterThan(0);
    expect(result.reason).toMatchObject({ kind: 'review', count: 2, examPressure: false });
  });

  it('2. Nichts fällig, Kasten gefüllt: schlägt neue Muskeln aus dem Pfad vor', () => {
    const result = plan({
      cards: {
        'M. deltoideus': card({ dueInDays: 7, fach: 3 }),
        'M. biceps brachii': card({ dueInDays: 14, fach: 4 }),
      },
    });

    expect(result.kind).toBe('new');
    expect(result.dueCards).toEqual([]);
    expect(result.dueTotal).toBe(0);
    expect(result.newSuggestions.length).toBeGreaterThan(0);
    expect(result.newSuggestions).not.toContain('M. deltoideus');
    expect(result.estimatedMinutes).toBeGreaterThan(0);
    expect(result.reason.kind).toBe('new');
  });

  it('3. Kasten leer: needsOnboarding — aber mit Startvorschlägen, nie ohne Vorschlag', () => {
    const result = plan({ cards: {} });

    expect(result.kind).toBe('needsOnboarding');
    expect(result.deckSize).toBe(0);
    expect(result.dueCards).toEqual([]);
    expect(result.newSuggestions.length).toBeGreaterThan(0);
    expect(result.reason.count).toBe(result.newSuggestions.length);
  });

  it('4. Überfällig-Stau: auf die Tagesdosis gedeckelt, Gesamtzahl bleibt sichtbar', () => {
    const many = Array.from({ length: 80 }, (_, i) => muscle(`M. test ${String(i).padStart(2, '0')}`, 'upper'));
    const cards = Object.fromEntries(many.map((m) => [m.nameLatin, card({ dueInDays: -5 })]));

    const result = getTodayPlan({ cards, muscles: many, now: NOW });

    expect(result.kind).toBe('backlog');
    expect(result.dueTotal).toBe(80);
    expect(result.dueCards).toHaveLength(DEFAULT_DAILY_DOSE);
    expect(result.dailyDose).toBe(DEFAULT_DAILY_DOSE);
    expect(result.estimatedMinutes).toBe(estimateMinutes(DEFAULT_DAILY_DOSE));
  });
});

describe('getTodayPlan — Priorisierung', () => {
  it('zieht Karten aus der schwächsten Region vor', () => {
    // Die zwei fälligen Karten sind in Fach, Verzug und Lookups identisch — nur die
    // Region unterscheidet sie. upper ist im Deck stark (2 von 3 gemeistert), lower
    // schwach (0 von 2). Die nicht fälligen Karten setzen nur die Beherrschung.
    const result = plan({
      cards: {
        'M. deltoideus': card({ fach: 3, dueInDays: -1 }),
        'M. gluteus maximus': card({ fach: 3, dueInDays: -1 }),
        'M. biceps brachii': card({ fach: 6, dueInDays: 30 }),
        'M. triceps brachii': card({ fach: 6, dueInDays: 30 }),
        'M. rectus femoris': card({ fach: 1, dueInDays: 30 }),
      },
    });

    expect(result.dueTotal).toBe(2);
    expect(result.focusRegion).toBe('lower');
    expect(result.dueCards[0]).toBe('M. gluteus maximus');
  });

  it('priorisiert mehrfach nachgeschlagene Muskeln höher', () => {
    const base = { fach: 3, dueInDays: -1 };
    const cards = {
      'M. deltoideus': card(base),
      'M. biceps brachii': card(base),
      'M. triceps brachii': card(base),
    };

    const ohne = plan({ cards });
    const mit = plan({ cards, lookupCounts: { 'M. triceps brachii': 4 } });

    expect(ohne.dueCards[0]).not.toBe('M. triceps brachii');
    expect(mit.dueCards[0]).toBe('M. triceps brachii');
  });

  it('priorisiert als schwierig markierte Karten und den größten Verzug', () => {
    const result = plan({
      cards: {
        'M. deltoideus': card({ fach: 3, dueInDays: -1 }),
        'M. biceps brachii': card({ fach: 3, dueInDays: -1, difficult: true }),
      },
    });

    expect(result.dueCards[0]).toBe('M. biceps brachii');
  });

  it('schlägt bei leerem Kasten zuerst leichte Muskeln vor', () => {
    const result = plan({ cards: {} });
    const first = MUSCLES.find((m) => m.nameLatin === result.newSuggestions[0]);

    expect(first?.difficulty).toBe(1);
    expect(result.newSuggestions.length).toBeLessThanOrEqual(NEW_SUGGESTION_COUNT);
  });

  it('schlägt neue Muskeln bevorzugt aus der schwächsten Region des Decks vor', () => {
    // head ist im Deck schwach (Fach 1), upper stark (Fach 6) → Kopf-Muskel zuerst.
    const result = plan({
      cards: {
        'M. deltoideus': card({ fach: 6, dueInDays: 30 }),
        'M. biceps brachii': card({ fach: 6, dueInDays: 30 }),
        'M. masseter': card({ fach: 1, dueInDays: 30 }),
      },
      muscles: [...MUSCLES, muscle('M. temporalis', 'head', 3)],
    });

    expect(result.kind).toBe('new');
    expect(result.newSuggestions[0]).toBe('M. temporalis');
    expect(result.focusRegion).toBe('head');
  });
});

describe('getTodayPlan — gegen die echten Muskeldaten', () => {
  it('liefert ohne übergebene Muskeln aus dem Loader einen Startvorschlag', () => {
    const result = getTodayPlan({ cards: {}, now: NOW });

    expect(result.kind).toBe('needsOnboarding');
    expect(result.newSuggestions).toHaveLength(NEW_SUGGESTION_COUNT);
    expect(new Set(result.newSuggestions).size).toBe(NEW_SUGGESTION_COUNT);
  });
});

describe('getTodayPlan — Prüfungsdruck', () => {
  it('hebt die Tagesdosis bei nahem Termin an und meldet das als Grund', () => {
    const cards = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`M. test ${String(i).padStart(2, '0')}`, card({ dueInDays: -1 })]),
    );
    const muscles = Object.keys(cards).map((n) => muscle(n, 'upper'));

    const entspannt = getTodayPlan({ cards, muscles, now: NOW });
    const knapp = getTodayPlan({ cards, muscles, now: NOW, examDate: '2026-07-15T00:00:00.000Z' });

    expect(entspannt.dueCards).toHaveLength(DEFAULT_DAILY_DOSE);
    expect(entspannt.reason.examPressure).toBe(false);
    expect(knapp.daysUntilExam).toBe(3);
    expect(knapp.dueCards).toHaveLength(MAX_DAILY_DOSE);
    expect(knapp.reason.examPressure).toBe(true);
  });
});
