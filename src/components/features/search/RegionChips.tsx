import { REGION_IDS } from '../../../data/search';
import { regionLabel } from '../../../data/labels';
import { useFilterStore } from '../../../store/useFilterStore';

/**
 * Mobiler Schnellfilter: horizontale Reihe von Region-Chips über der Ergebnis-
 * liste. Tippen schaltet die Region an/aus (Mehrfachauswahl, wie im FilterPanel).
 * Als Toggle-Buttons ausgezeichnet (`aria-pressed`); der volle Filtersatz bleibt
 * im Sheet erreichbar.
 */
export function RegionChips() {
  const regions = useFilterStore((s) => s.regions);
  const toggleRegion = useFilterStore((s) => s.toggleRegion);

  return (
    <div className="region-chips" role="group" aria-label="Region schnell filtern">
      {REGION_IDS.map((region) => {
        const active = regions.includes(region);
        return (
          <button
            key={region}
            type="button"
            className={`chip region-chips__chip${active ? ' chip--active' : ''}`}
            aria-pressed={active}
            onClick={() => toggleRegion(region)}
          >
            {regionLabel(region)}
          </button>
        );
      })}
    </div>
  );
}
