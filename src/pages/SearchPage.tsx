import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { SearchField } from '../components/features/search/SearchField';
import { FilterPanel } from '../components/features/search/FilterPanel';
import { MuscleGrid } from '../components/features/search/MuscleGrid';
import { filterToQueryString, searchParamsToFilter } from '../data/filterUrl';
import { useMuscleSearch } from '../hooks/useMuscleSearch';
import { useFilterStore } from '../store/useFilterStore';
import type { MuscleFilter } from '../types';
import '../components/features/search/search.css';

const pickFilter = (s: MuscleFilter): MuscleFilter => ({
  query: s.query,
  regions: s.regions,
  joint: s.joint,
  movement: s.movement,
  innervation: s.innervation,
  sort: s.sort,
});

/**
 * Suche & Filter (Etappe 3a). Die URL ist deep-linkbar: beim Laden hydratisiert
 * der Filter aus den Query-Params, danach spiegelt jede Änderung zurück in die URL.
 */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilter = useFilterStore((s) => s.setFilter);
  const filter = useFilterStore(useShallow(pickFilter));
  const { results, options, total, count } = useMuscleSearch();

  // 1) Beim ersten Rendern: Filter aus der URL übernehmen (URL ist die Wahrheit).
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setFilter(searchParamsToFilter(searchParams));
  }, [searchParams, setFilter]);

  // 2) Danach: Filteränderungen in die URL spiegeln (ersetzt, kein History-Spam).
  useEffect(() => {
    if (!hydrated.current) return;
    const next = filterToQueryString(filter);
    if (next !== searchParams.toString()) {
      setSearchParams(next ? new URLSearchParams(next) : {}, { replace: true });
    }
  }, [filter, searchParams, setSearchParams]);

  return (
    <section className="page search-page">
      <header className="search-page__header">
        <p className="page__eyebrow">Nachschlagen</p>
        <h1 className="page__title">Muskulatur</h1>
        <p className="search-page__lead">
          {total} Muskeln · Suche über lateinischen Namen, deutsche Begriffe und Stichworte.
        </p>
        <SearchField />
      </header>

      <div className="search-page__body">
        <FilterPanel options={options} count={count} />
        <MuscleGrid muscles={results} />
      </div>
    </section>
  );
}
