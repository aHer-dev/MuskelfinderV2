import { beforeEach, describe, expect, it } from 'vitest';
import {
  milestonePractice,
  regionPractice,
  weakCardsPractice,
  weakestRegionPractice,
  type PracticeInput,
} from './practice';
import { isDue } from '../persistence/leitner';
import { useProgressStore } from '../store/useProgressStore';
import { buildQueue } from '../store/useSessionStore';
import type { FlashcardCard } from '../persistence/types';

const UPPER = ['M. pectoralis minor', 'M. serratus anterior', 'M. subclavius'];
const LOWER = ['M. psoas minor', 'M. psoas major', 'M. iliacus'];
const HEAD = ['M. masseter', 'M. temporalis'];

const DAY = 86_400_000;

/** Karte mit Fach und Fälligkeit. `dueInDays > 0` = noch nicht fällig. */
function card(fach: number, dueInDays = -1): FlashcardCard {
  return {
    fach,
    nextDue: new Date(Date.now() + dueInDays * DAY).toISOString(),
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}

function deck(entries: Record<string, FlashcardCard>): PracticeInput {
  return { cards: entries };
}

describe('regionPractice', () => {
  it('liefert nur die fälligen Karten der Region', () => {
    const input = deck({
      [UPPER[0]]: card(2),
      [UPPER[1]]: card(3),
      [LOWER[0]]: card(1),
    });
    const result = regionPractice(input, 'upper');
    expect(result.blocker).toBeNull();
    expect([...result.names].sort()).toEqual([UPPER[0], UPPER[1]].sort());
  });

  it('sagt „keine Karten", wenn aus der Region nichts im Kasten liegt', () => {
    const result = regionPractice(deck({ [UPPER[0]]: card(2) }), 'head');
    expect(result).toEqual({ names: [], blocker: 'noCards' });
  });

  it('sagt „nichts fällig", wenn die Karten der Region alle in der Zukunft stehen', () => {
    const result = regionPractice(deck({ [UPPER[0]]: card(5, 7), [UPPER[1]]: card(6, 3) }), 'upper');
    expect(result).toEqual({ names: [], blocker: 'nothingDue' });
  });
});

describe('weakCardsPractice', () => {
  it('nimmt Fach 1–2, nicht die Karten darüber', () => {
    const input = deck({
      [UPPER[0]]: card(1),
      [UPPER[1]]: card(2),
      [UPPER[2]]: card(3),
      [LOWER[0]]: card(7),
    });
    const result = weakCardsPractice(input);
    expect([...result.names].sort()).toEqual([UPPER[0], UPPER[1]].sort());
  });

  it('unterscheidet „nichts zu verbessern" von „nichts fällig"', () => {
    // Keine schwache Karte im Kasten → es gibt hier gar nichts zu reparieren.
    expect(weakCardsPractice(deck({ [UPPER[0]]: card(6) })).blocker).toBe('nothingToFix');
    // Schwache Karte, aber heute nicht dran → anderer Grund, anderer Satz.
    expect(weakCardsPractice(deck({ [UPPER[0]]: card(2, 4) })).blocker).toBe('nothingDue');
  });
});

describe('milestonePractice', () => {
  it('nimmt die Karten, die dem Ziel am nächsten sind — höchstes Fach zuerst', () => {
    const input = deck({
      [UPPER[0]]: card(1),
      [UPPER[1]]: card(4),
      [UPPER[2]]: card(3),
    });
    const result = milestonePractice(input, 2);
    expect(result.names).toEqual([UPPER[1], UPPER[2]]); // Fach 4, dann 3 — nicht die 1
  });

  it('liefert höchstens so viele Karten, wie bis zum Meilenstein fehlen', () => {
    const input = deck({ [UPPER[0]]: card(4), [UPPER[1]]: card(4), [UPPER[2]]: card(3) });
    expect(milestonePractice(input, 1).names).toHaveLength(1);
  });

  it('ignoriert bereits gemeisterte Karten (Fach ≥ 5)', () => {
    const input = deck({ [UPPER[0]]: card(6), [UPPER[1]]: card(2) });
    expect(milestonePractice(input, 3).names).toEqual([UPPER[1]]);
  });

  it('ist blockiert, wenn alle Meilensteine erreicht sind', () => {
    expect(milestonePractice(deck({ [UPPER[0]]: card(2) }), null).blocker).toBe('nothingToFix');
  });
});

describe('weakestRegionPractice', () => {
  it('wählt die schwächste Region — aber nur unter denen, die heute Arbeit haben', () => {
    /* „head" ist mit 0 % die schwächste Region, hat aber nichts Fälliges. Ein Knopf,
       der sie vorschlägt, würde eine leere Sitzung starten — genau die Falle. */
    const input = deck({
      [HEAD[0]]: card(1, 9),
      [HEAD[1]]: card(1, 9),
      [LOWER[0]]: card(2),
      [LOWER[1]]: card(6, 10), // gemeistert → „lower" steht bei 50 %
      [UPPER[0]]: card(7),
      [UPPER[1]]: card(6),
      [UPPER[2]]: card(5),
    });
    const result = weakestRegionPractice(input);
    expect(result.region).toBe('lower'); // 50 % beherrscht und fällig — nicht „head"
    expect(result.selection.names).toEqual([LOWER[0]]);
  });

  it('ist begründet blockiert, wenn der Kasten leer ist', () => {
    expect(weakestRegionPractice(deck({}))).toEqual({
      region: null,
      selection: { names: [], blocker: 'noCards' },
    });
  });

  it('ist begründet blockiert, wenn nichts fällig ist', () => {
    const result = weakestRegionPractice(deck({ [UPPER[0]]: card(3, 5) }));
    expect(result.region).toBeNull();
    expect(result.selection.blocker).toBe('nothingDue');
  });
});

describe('Was der Knopf verspricht, liefert die Sitzung auch', () => {
  beforeEach(() => {
    useProgressStore.setState((s) => ({
      flashcards: { ...s.flashcards, cards: {} },
    }));
  });

  it('kein Selektor gibt eine Karte aus, die nicht fällig ist', () => {
    const now = new Date();
    const input = deck({
      [UPPER[0]]: card(1),
      [UPPER[1]]: card(4, 6),
      [LOWER[0]]: card(2),
      [LOWER[1]]: card(6, 30),
      [HEAD[0]]: card(3),
    });
    const selections = [
      regionPractice(input, 'upper'),
      regionPractice(input, 'lower'),
      weakCardsPractice(input),
      milestonePractice(input, 5),
      weakestRegionPractice(input).selection,
    ];
    for (const { names } of selections) {
      for (const name of names) {
        expect(isDue(input.cards[name], now), `${name} ist nicht fällig`).toBe(true);
      }
    }
  });

  it('buildQueue übernimmt die Auswahl eines CTA unverändert', () => {
    // Der Weg, den ein CTA nimmt: Auswahl → Router-State → buildQueue (7b).
    const cards = {
      [UPPER[0]]: card(1),
      [UPPER[1]]: card(2),
      [UPPER[2]]: card(4, 9), // nicht fällig — darf gar nicht erst vorgeschlagen werden
      [LOWER[0]]: card(3),
    };
    useProgressStore.setState((s) => ({ flashcards: { ...s.flashcards, cards } }));

    const selection = regionPractice(deck(cards), 'upper');
    const queue = buildQueue({ names: selection.names, limit: 0, scope: 'all' });

    expect(queue).toEqual(selection.names);
    expect(queue).not.toContain(UPPER[2]);
  });
});
