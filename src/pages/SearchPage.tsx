import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { SearchField } from '../components/features/search/SearchField';
import { FilterPanel } from '../components/features/search/FilterPanel';
import { RegionChips } from '../components/features/search/RegionChips';
import { ActiveFilters } from '../components/features/search/ActiveFilters';
import { MuscleGrid } from '../components/features/search/MuscleGrid';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { filterToQueryString, searchParamsToFilter } from '../data/filterUrl';
import { useMuscleSearch } from '../hooks/useMuscleSearch';
import { useIsDesktop } from '../hooks/useMediaQuery';
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
  const reset = useFilterStore((s) => s.reset);
  const filter = useFilterStore(useShallow(pickFilter));
  const { results, options, total, count, query } = useMuscleSearch();
  const isDesktop = useIsDesktop();
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount =
    filter.regions.length +
    (filter.joint ? 1 : 0) +
    (filter.movement ? 1 : 0) +
    (filter.innervation ? 1 : 0);

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
        <div className="search-page__results">
          {!isDesktop && (
            <>
              <button
                type="button"
                className="btn btn--ghost search-page__filter-btn"
                onClick={() => setFilterOpen(true)}
              >
                <Icon name="icFilter" size={18} /> Filter
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              <RegionChips />
            </>
          )}
          <ActiveFilters />
          <MuscleGrid muscles={results} query={query} />
        </div>
        {isDesktop && <FilterPanel options={options} count={count} />}
      </div>

      {!isDesktop && (
        <Sheet
          open={filterOpen}
          title="Filter"
          onClose={() => setFilterOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={reset}
                disabled={activeFilterCount === 0 && !filter.query}
              >
                Zurücksetzen
              </button>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => setFilterOpen(false)}
              >
                {count} {count === 1 ? 'Ergebnis' : 'Ergebnisse'} anzeigen
              </button>
            </>
          }
        >
          <FilterPanel options={options} count={count} bare />
        </Sheet>
      )}
    </section>
  );
}
