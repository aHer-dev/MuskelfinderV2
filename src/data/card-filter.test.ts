import { beforeEach, describe, expect, it } from 'vitest';
import { applyCardFilter, isCardFilter, matchesCardFilter, type CardFilter } from './card-filter';
import { quizSeriesKey } from './quiz';
import { useProgressStore } from '../store/useProgressStore';
import { buildQueue } from '../store/useSessionStore';
import type { FlashcardCard } from '../persistence/types';

const DAY = 86_400_000;

interface CardOpts {
  fach?: number;
  dueInDays?: number;
  totalWrong?: number;
  lastSeen?: string | null;
  difficult?: boolean;
}

function card({
  fach = 3,
  dueInDays = -1,
  totalWrong = 0,
  lastSeen = new Date().toISOString(),
  difficult = false,
}: CardOpts = {}): FlashcardCard {
  return {
    fach,
    nextDue: new Date(Date.now() + dueInDays * DAY).toISOString(),
    totalCorrect: 1,
    totalWrong,
    lastSeen,
    difficult,
  };
}

/* Ein Kasten, in dem jede Karte für genau einen Filter steht. */
const CARDS: Record<string, FlashcardCard> = {
  'M. pectoralis minor': card({ totalWrong: 2 }), // falsch beantwortet
  'M. serratus anterior': card({ lastSeen: null, fach: 1 }), // nie gesehen
  'M. subclavius': card({ difficult: true }), // schwierig markiert
  'M. psoas major': card(), // unauffällig, aber fällig
  'M. iliacus': card({ dueInDays: 8, totalWrong: 5 }), // falsch — aber NICHT fällig
};

describe('matchesCardFilter', () => {
  const CASES: Array<[CardFilter, string, boolean]> = [
    ['wrong', 'M. pectoralis minor', true],
    ['wrong', 'M. psoas major', false],
    ['unseen', 'M. serratus anterior', true],
    ['unseen', 'M. psoas major', false],
    ['difficult', 'M. subclavius', true],
    ['difficult', 'M. psoas major', false],
    ['all', 'M. psoas major', true],
  ];

  it.each(CASES)('%s trifft auf %s → %s', (filter, name, expected) => {
    expect(matchesCardFilter(CARDS[name], filter)).toBe(expected);
  });

  it('liest alles aus der Karte — es wird nichts Neues gespeichert', () => {
    // Der Produktplan sagt „useQuizStore"; die Wahrheit steht in der Karte (ADR 0002).
    const keys = Object.keys(CARDS['M. pectoralis minor']);
    expect(keys).toContain('totalWrong');
    expect(keys).toContain('lastSeen');
    expect(keys).toContain('difficult');
  });
});

describe('applyCardFilter', () => {
  it('nimmt Karten weg, ohne die Reihenfolge anzufassen (die 7b-Priorisierung überlebt)', () => {
    const candidates = ['M. psoas major', 'M. pectoralis minor', 'M. subclavius', 'M. iliacus'];
    const result = applyCardFilter({ cards: CARDS, candidates, filter: 'wrong' });
    expect(result).toEqual(['M. pectoralis minor', 'M. iliacus']); // Reihenfolge wie übergeben
  });

  it('überspringt Namen, zu denen keine Karte (mehr) im Kasten liegt', () => {
    const result = applyCardFilter({
      cards: CARDS,
      candidates: ['M. geloescht', 'M. pectoralis minor'],
      filter: 'wrong',
    });
    expect(result).toEqual(['M. pectoralis minor']);
  });

  it('der Leerfall ist leer, nicht kaputt', () => {
    const clean = { 'M. psoas major': card() };
    expect(applyCardFilter({ cards: clean, candidates: ['M. psoas major'], filter: 'wrong' })).toEqual([]);
  });
});

describe('isCardFilter', () => {
  it('lässt nur echte Filter durch — der Router-State kann alles sein', () => {
    expect(isCardFilter('wrong')).toBe(true);
    expect(isCardFilter('all')).toBe(true);
    expect(isCardFilter('kaputt')).toBe(false);
    expect(isCardFilter(null)).toBe(false);
    expect(isCardFilter(7)).toBe(false);
  });
});

describe('buildQueue mit Filter (8b)', () => {
  beforeEach(() => {
    useProgressStore.setState((s) => ({ flashcards: { ...s.flashcards, cards: CARDS } }));
  });

  it('ohne Filter ist alles wie vorher — alle fälligen Karten', () => {
    const queue = buildQueue({ limit: 0, scope: 'all' });
    expect(queue).toHaveLength(4); // alle außer „M. iliacus" (nicht fällig)
    expect(queue).not.toContain('M. iliacus');
  });

  it('„nur falsch beantwortete" hebt die Fälligkeit NICHT auf', () => {
    /* „M. iliacus" wurde 5× falsch beantwortet, ist aber erst in 8 Tagen dran. Der
       Filter grenzt die fälligen Karten ein — er macht keine eigene Terminplanung. */
    const queue = buildQueue({ limit: 0, scope: 'all', filter: 'wrong' });
    expect(queue).toEqual(['M. pectoralis minor']);
  });

  it('„nie gesehen" und „schwierig markiert" greifen ebenso', () => {
    expect(buildQueue({ limit: 0, scope: 'all', filter: 'unseen' })).toEqual([
      'M. serratus anterior',
    ]);
    expect(buildQueue({ limit: 0, scope: 'all', filter: 'difficult' })).toEqual(['M. subclavius']);
  });

  it('kombiniert sich mit dem Bereichsfilter', () => {
    // „M. pectoralis minor" liegt in der oberen Extremität, „M. iliacus" in der unteren.
    expect(buildQueue({ limit: 0, scope: 'upper', filter: 'wrong' })).toEqual([
      'M. pectoralis minor',
    ]);
    expect(buildQueue({ limit: 0, scope: 'lower', filter: 'wrong' })).toEqual([]);
  });

  it('greift der Filter ins Leere, ist die Warteschlange leer — kein Absturz', () => {
    expect(buildQueue({ limit: 0, scope: 'head', filter: 'wrong' })).toEqual([]);
  });

  it('erhält die Vorpriorisierung aus 7b und deckelt danach', () => {
    const names = ['M. subclavius', 'M. pectoralis minor', 'M. psoas major'];
    expect(buildQueue({ names, limit: 0, scope: 'all' })).toEqual(names);
    expect(buildQueue({ names, limit: 2, scope: 'all' })).toEqual(names.slice(0, 2));
    // Der Filter nimmt weg, ohne umzusortieren.
    expect(buildQueue({ names, limit: 0, scope: 'all', filter: 'difficult' })).toEqual([
      'M. subclavius',
    ]);
  });
});

describe('Harte Grenze: der Serien-Schlüssel bleibt unangetastet (ADR 0002)', () => {
  it('quizSeriesKey ohne Filter ist exakt der bisherige V1-Key', () => {
    // 8b fasst den Quiz-Serien-Schlüssel nicht an — er hat keinen Filter-Parameter.
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    expect(quizSeriesKey('function-to-muscle')).toBe(
      'function-to-muscle::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
  });
});
