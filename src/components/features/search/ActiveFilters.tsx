import { regionLabel } from '../../../data/labels';
import { Icon } from '../../ui/Icon';
import { useFilterStore } from '../../../store/useFilterStore';
import type { RegionId } from '../../../types';

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Reihe aktiver Filter als entfernbare Chips über der Ergebnisliste (Frame 1b). */
export function ActiveFilters() {
  const regions = useFilterStore((s) => s.regions);
  const joint = useFilterStore((s) => s.joint);
  const movement = useFilterStore((s) => s.movement);
  const innervation = useFilterStore((s) => s.innervation);
  const toggleRegion = useFilterStore((s) => s.toggleRegion);
  const setJoint = useFilterStore((s) => s.setJoint);
  const setMovement = useFilterStore((s) => s.setMovement);
  const setInnervation = useFilterStore((s) => s.setInnervation);
  const reset = useFilterStore((s) => s.reset);

  const chips: ActiveChip[] = [
    ...regions.map((region: RegionId) => ({
      key: `r-${region}`,
      label: regionLabel(region),
      onRemove: () => toggleRegion(region),
    })),
    ...(joint ? [{ key: 'j', label: joint, onRemove: () => setJoint(null) }] : []),
    ...(movement ? [{ key: 'm', label: movement, onRemove: () => setMovement(null) }] : []),
    ...(innervation ? [{ key: 'i', label: innervation, onRemove: () => setInnervation(null) }] : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="active-filters" aria-label="Aktive Filter">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="chip chip--active active-filters__chip"
          onClick={chip.onRemove}
          aria-label={`Filter „${chip.label}" entfernen`}
        >
          {chip.label}
          <Icon name="icClose" size={14} />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" className="active-filters__reset" onClick={reset}>
          Alle löschen
        </button>
      )}
    </div>
  );
}
