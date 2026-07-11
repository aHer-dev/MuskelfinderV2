import { describe, expect, it } from 'vitest';
import { EMPTY_FILTER, type MuscleFilter } from '../types';
import { filterToQueryString, searchParamsToFilter } from './filterUrl';

function roundTrip(filter: MuscleFilter): MuscleFilter {
  return searchParamsToFilter(new URLSearchParams(filterToQueryString(filter)));
}

describe('filterUrl — Serialisierung', () => {
  it('Default-Filter erzeugt einen leeren Query-String', () => {
    expect(filterToQueryString(EMPTY_FILTER)).toBe('');
  });

  it('lässt Defaults weg (sort=alpha steht nicht in der URL)', () => {
    const qs = filterToQueryString({ ...EMPTY_FILTER, query: 'delt', sort: 'alpha' });
    expect(qs).toBe('q=delt');
  });

  it('serialisiert alle gesetzten Felder', () => {
    const params = new URLSearchParams(
      filterToQueryString({
        query: 'delt',
        regions: ['upper', 'lower'],
        joint: 'Art. humeri',
        movement: 'flexion',
        innervation: 'N. axillaris',
        sort: 'difficulty',
      }),
    );
    expect(params.get('q')).toBe('delt');
    expect(params.get('r')).toBe('lower,upper');
    expect(params.get('j')).toBe('Art. humeri');
    expect(params.get('m')).toBe('flexion');
    expect(params.get('i')).toBe('N. axillaris');
    expect(params.get('s')).toBe('difficulty');
  });
});

describe('filterUrl — Round-Trip & Robustheit', () => {
  it('Filter → URL → Filter ist verlustfrei (Regionen sortiert)', () => {
    const filter: MuscleFilter = {
      query: 'biceps',
      regions: ['trunk', 'upper'],
      joint: 'Art. cubiti',
      movement: 'flexion',
      innervation: 'N. musculocutaneus',
      sort: 'relevance',
    };
    expect(roundTrip(filter)).toEqual({ ...filter, regions: ['trunk', 'upper'] });
  });

  it('verwirft ungültige Regionen und Sortierschlüssel', () => {
    const filter = searchParamsToFilter(new URLSearchParams('r=upper,mars&s=chaos'));
    expect(filter.regions).toEqual(['upper']);
    expect(filter.sort).toBe('alpha');
  });

  it('leere Parameter werden zu null / Defaults', () => {
    const filter = searchParamsToFilter(new URLSearchParams(''));
    expect(filter).toEqual(EMPTY_FILTER);
  });
});
