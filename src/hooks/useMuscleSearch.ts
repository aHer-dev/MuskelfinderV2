/* =========================================================================
   useMuscleSearch — verbindet Filter-Store + Datenschicht-Suche für die UI.
   src/hooks/useMuscleSearch.ts

   Debounct die Anfrage, memoisiert das Ergebnis und liefert die verfügbaren
   Filter-Optionen. Das eigentliche Matching liegt getestet in `data/search.ts`.
   ========================================================================= */

import { useMemo } from 'react';
import { MOVEMENTS, MUSCLES } from '../data';
import { filterMuscles, getFilterOptions } from '../data/search';
import type { FilterOptions } from '../data/search';
import { useFilterStore } from '../store/useFilterStore';
import type { Muscle } from '../types';
import { useDebouncedValue } from './useDebouncedValue';

export interface MuscleSearchResult {
  results: Muscle[];
  options: FilterOptions;
  total: number;
  count: number;
  /** Die (debouncte) Anfrage, die zu den Treffern führte — für Highlighting. */
  query: string;
}

export function useMuscleSearch(): MuscleSearchResult {
  const query = useFilterStore((s) => s.query);
  const regions = useFilterStore((s) => s.regions);
  const joint = useFilterStore((s) => s.joint);
  const movement = useFilterStore((s) => s.movement);
  const innervation = useFilterStore((s) => s.innervation);
  const sort = useFilterStore((s) => s.sort);

  const debouncedQuery = useDebouncedValue(query, 150);

  const results = useMemo(
    () =>
      filterMuscles(MUSCLES, {
        query: debouncedQuery,
        regions,
        joint,
        movement,
        innervation,
        sort,
      }),
    [debouncedQuery, regions, joint, movement, innervation, sort],
  );

  const options = useMemo(() => getFilterOptions(MUSCLES, MOVEMENTS), []);

  return { results, options, total: MUSCLES.length, count: results.length, query: debouncedQuery };
}
