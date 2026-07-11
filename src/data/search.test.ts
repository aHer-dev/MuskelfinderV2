import { describe, expect, it } from 'vitest';
import { EMPTY_FILTER, type Muscle, type MuscleFilter } from '../types';
import { filterMuscles, foldText, getFilterOptions, highlightName, normalizeText } from './search';

function m(partial: Partial<Muscle> & { id: string; nameLatin: string }): Muscle {
  return {
    id: partial.id,
    nameLatin: partial.nameLatin,
    nameDE: partial.nameDE,
    region: partial.region ?? 'upper',
    subregion: partial.subregion ?? '',
    joints: partial.joints ?? [],
    origin: '',
    insertion: '',
    functions: partial.functions ?? [],
    functionDescription: '',
    innervation: partial.innervation ?? '',
    segments: '',
    difficulty: partial.difficulty ?? 1,
    images: [],
    tags: partial.tags ?? [],
  };
}

const deltoideus = m({
  id: 'deltoideus',
  nameLatin: 'M. deltoideus',
  region: 'upper',
  joints: ['Art. humeri'],
  functions: ['abduktion', 'flexion'],
  innervation: 'N. axillaris',
  difficulty: 1,
  tags: ['#Abduktor'],
});
const biceps = m({
  id: 'biceps-brachii',
  nameLatin: 'M. biceps brachii',
  region: 'upper',
  joints: ['Art. cubiti'],
  functions: ['flexion'],
  innervation: 'N. musculocutaneus',
  difficulty: 2,
});
const gluteus = m({
  id: 'gluteus-maximus',
  nameLatin: 'M. gluteus maximus',
  region: 'lower',
  joints: ['Art. coxae'],
  functions: ['extension'],
  innervation: 'N. gluteus inferior',
  difficulty: 3,
});
const obliquus = m({
  id: 'obliquus-externus',
  nameLatin: 'M. obliquus externus abdominis',
  region: 'trunk',
  functions: ['flexion'],
  innervation: 'Nn. intercostales',
  tags: ['#Äußere', '#Bauchwand'],
  difficulty: 2,
});

const ALL = [deltoideus, biceps, gluteus, obliquus];

function withFilter(partial: Partial<MuscleFilter>): MuscleFilter {
  return { ...EMPTY_FILTER, ...partial };
}

describe('normalizeText', () => {
  it('senkt Groß-/Kleinschreibung und entfernt Diakritika', () => {
    expect(normalizeText('M. Äußere')).toBe('m aussere');
    expect(normalizeText('N. axillaris')).toBe('n axillaris');
  });
});

describe('highlightName', () => {
  it('markiert das erste Vorkommen der Anfrage', () => {
    expect(highlightName('M. deltoideus', 'delt')).toEqual([
      { text: 'M. ', match: false },
      { text: 'delt', match: true },
      { text: 'oideus', match: false },
    ]);
  });

  it('ist diakritika-tolerant und erhält die Originalzeichen', () => {
    // foldText entfernt Diakritika (Ä→a), ß bleibt.
    expect(foldText('Äußere')).toBe('außere');
    expect(highlightName('M. Äußere', 'au')).toEqual([
      { text: 'M. ', match: false },
      { text: 'Äu', match: true },
      { text: 'ßere', match: false },
    ]);
  });

  it('gibt bei leerer Anfrage oder ohne Treffer ein einzelnes Segment zurück', () => {
    expect(highlightName('M. deltoideus', '')).toEqual([{ text: 'M. deltoideus', match: false }]);
    expect(highlightName('M. deltoideus', 'xyz')).toEqual([
      { text: 'M. deltoideus', match: false },
    ]);
  });
});

describe('filterMuscles — Suche', () => {
  it('findet über den lateinischen Namen (Präfix)', () => {
    const res = filterMuscles(ALL, withFilter({ query: 'deltoid' }));
    expect(res.map((x) => x.id)).toEqual(['deltoideus']);
  });

  it('ist diakritika-tolerant und sucht in Tags', () => {
    const res = filterMuscles(ALL, withFilter({ query: 'aussere' }));
    expect(res.map((x) => x.id)).toContain('obliquus-externus');
  });

  it('verknüpft mehrere Tokens mit UND', () => {
    expect(filterMuscles(ALL, withFilter({ query: 'obliquus externus' })).map((x) => x.id)).toEqual([
      'obliquus-externus',
    ]);
    expect(filterMuscles(ALL, withFilter({ query: 'deltoideus gluteus' }))).toHaveLength(0);
  });

  it('leere Anfrage liefert alle (alphabetisch)', () => {
    expect(filterMuscles(ALL, EMPTY_FILTER).map((x) => x.id)).toEqual([
      'biceps-brachii',
      'deltoideus',
      'gluteus-maximus',
      'obliquus-externus',
    ]);
  });
});

describe('filterMuscles — Filter', () => {
  it('filtert nach Region (Mehrfachauswahl)', () => {
    expect(filterMuscles(ALL, withFilter({ regions: ['lower'] })).map((x) => x.id)).toEqual([
      'gluteus-maximus',
    ]);
    expect(
      filterMuscles(ALL, withFilter({ regions: ['lower', 'trunk'] })).map((x) => x.id),
    ).toEqual(['gluteus-maximus', 'obliquus-externus']);
  });

  it('filtert nach Gelenk, Bewegung und Innervation', () => {
    expect(filterMuscles(ALL, withFilter({ joint: 'Art. cubiti' })).map((x) => x.id)).toEqual([
      'biceps-brachii',
    ]);
    expect(filterMuscles(ALL, withFilter({ movement: 'flexion' })).map((x) => x.id)).toEqual([
      'biceps-brachii',
      'deltoideus',
      'obliquus-externus',
    ]);
    expect(filterMuscles(ALL, withFilter({ innervation: 'N. axillaris' })).map((x) => x.id)).toEqual(
      ['deltoideus'],
    );
  });

  it('kombiniert Filter (Region + Bewegung)', () => {
    const res = filterMuscles(ALL, withFilter({ regions: ['upper'], movement: 'flexion' }));
    expect(res.map((x) => x.id)).toEqual(['biceps-brachii', 'deltoideus']);
  });
});

describe('filterMuscles — Sortierung', () => {
  it('difficulty sortiert aufsteigend, dann alphabetisch', () => {
    const res = filterMuscles(ALL, withFilter({ sort: 'difficulty' }));
    expect(res.map((x) => x.difficulty)).toEqual([1, 2, 2, 3]);
    expect(res[0].id).toBe('deltoideus');
  });

  it('relevance stellt den besten Treffer nach vorne', () => {
    const res = filterMuscles(ALL, withFilter({ query: 'brachii', sort: 'relevance' }));
    expect(res[0].id).toBe('biceps-brachii');
  });
});

describe('getFilterOptions', () => {
  it('sammelt vorkommende Gelenke, Bewegungen und Nerven', () => {
    const opts = getFilterOptions(ALL, [
      { id: 'flexion', label: 'Flexion' },
      { id: 'abduktion', label: 'Abduktion' },
      { id: 'extension', label: 'Extension' },
    ]);
    expect(opts.joints).toContain('Art. humeri');
    expect(opts.innervations).toContain('N. axillaris');
    expect(opts.movements.map((mv) => mv.id)).toContain('flexion');
    // Bewegung ohne Wörterbuch-Eintrag fällt auf die id zurück.
    expect(opts.movements.find((mv) => mv.id === 'flexion')?.label).toBe('Flexion');
  });
});
