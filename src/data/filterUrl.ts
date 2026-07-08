/* =========================================================================
   Filter ↔ URL-Query-Serialisierung — deep-linkbare Suche.
   src/data/filterUrl.ts

   Reine Funktionen (unit-getestet). Nur gesetzte Werte landen in der URL;
   Defaults bleiben weg, damit Links kurz und stabil bleiben. Unbekannte/ungültige
   Werte werden beim Parsen verworfen (kein Absturz bei manipulierten Links).
   ========================================================================= */

import { EMPTY_FILTER, type MuscleFilter, type RegionId, type SortKey } from '../types';
import { REGION_IDS, SORT_KEYS } from './search';

const REGION_SET = new Set<string>(REGION_IDS);
const SORT_SET = new Set<string>(SORT_KEYS);

/** Serialisiert einen Filter in URL-Query-Parameter (nur Nicht-Defaults). */
export function filterToSearchParams(filter: MuscleFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.query.trim()) params.set('q', filter.query.trim());
  if (filter.regions.length) params.set('r', [...filter.regions].sort().join(','));
  if (filter.joint) params.set('j', filter.joint);
  if (filter.movement) params.set('m', filter.movement);
  if (filter.innervation) params.set('i', filter.innervation);
  if (filter.sort !== EMPTY_FILTER.sort) params.set('s', filter.sort);
  return params;
}

/** Kompakter Query-String (ohne führendes `?`), leer bei Default-Filter. */
export function filterToQueryString(filter: MuscleFilter): string {
  return filterToSearchParams(filter).toString();
}

function parseRegions(raw: string | null): RegionId[] {
  if (!raw) return [];
  const seen = new Set<RegionId>();
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (REGION_SET.has(trimmed)) seen.add(trimmed as RegionId);
  }
  return [...seen];
}

function parseSort(raw: string | null): SortKey {
  return raw && SORT_SET.has(raw) ? (raw as SortKey) : EMPTY_FILTER.sort;
}

/** Baut einen validierten Filter aus URL-Query-Parametern (verwirft Ungültiges). */
export function searchParamsToFilter(params: URLSearchParams): MuscleFilter {
  return {
    query: params.get('q') ?? '',
    regions: parseRegions(params.get('r')),
    joint: params.get('j') || null,
    movement: params.get('m') || null,
    innervation: params.get('i') || null,
    sort: parseSort(params.get('s')),
  };
}
