import type { FilterOptions } from '../../../data/search';
import { REGION_IDS } from '../../../data/search';
import { regionLabel } from '../../../data/labels';
import { useFilterStore } from '../../../store/useFilterStore';
import type { SortKey } from '../../../types';

const SORT_LABELS: Record<SortKey, string> = {
  alpha: 'Alphabetisch',
  relevance: 'Relevanz',
  difficulty: 'Schwierigkeit',
};

/** Optionaler Wert für ein Select — `''` steht für „alle". */
function selectValue(value: string | null): string {
  return value ?? '';
}

/** Filter-Bedienfeld: Regionen (Mehrfach), Gelenk/Bewegung/Innervation, Sortierung. */
export function FilterPanel({
  options,
  count,
  bare = false,
}: {
  options: FilterOptions;
  count: number;
  /** true im Bottom-Sheet: ohne eigenes Panel-Chrome (Hintergrund/Rahmen/sticky). */
  bare?: boolean;
}) {
  const regions = useFilterStore((s) => s.regions);
  const joint = useFilterStore((s) => s.joint);
  const movement = useFilterStore((s) => s.movement);
  const innervation = useFilterStore((s) => s.innervation);
  const sort = useFilterStore((s) => s.sort);

  const toggleRegion = useFilterStore((s) => s.toggleRegion);
  const setJoint = useFilterStore((s) => s.setJoint);
  const setMovement = useFilterStore((s) => s.setMovement);
  const setInnervation = useFilterStore((s) => s.setInnervation);
  const setSort = useFilterStore((s) => s.setSort);
  const reset = useFilterStore((s) => s.reset);

  const hasActiveFilter =
    regions.length > 0 || joint !== null || movement !== null || innervation !== null;

  return (
    <aside className={`filter-panel${bare ? ' filter-panel--bare' : ''}`} aria-label="Filter">
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Region</legend>
        <div className="filter-group__checks">
          {REGION_IDS.map((region) => (
            <label key={region} className="checkbox">
              <input
                type="checkbox"
                checked={regions.includes(region)}
                onChange={() => toggleRegion(region)}
              />
              <span>{regionLabel(region)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="filter-select">
        <span className="filter-select__label">Gelenk</span>
        <select value={selectValue(joint)} onChange={(e) => setJoint(e.target.value || null)}>
          <option value="">Alle Gelenke</option>
          {options.joints.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-select">
        <span className="filter-select__label">Bewegung</span>
        <select value={selectValue(movement)} onChange={(e) => setMovement(e.target.value || null)}>
          <option value="">Alle Bewegungen</option>
          {options.movements.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-select">
        <span className="filter-select__label">Innervation</span>
        <select
          value={selectValue(innervation)}
          onChange={(e) => setInnervation(e.target.value || null)}
        >
          <option value="">Alle Nerven</option>
          {options.innervations.map((nerve) => (
            <option key={nerve} value={nerve}>
              {nerve}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-select">
        <span className="filter-select__label">Sortierung</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <div className="filter-panel__foot">
        <span className="filter-panel__count">{count} Treffer</span>
        {hasActiveFilter && (
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Zurücksetzen
          </button>
        )}
      </div>
    </aside>
  );
}
