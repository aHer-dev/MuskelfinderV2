import type { Muscle } from '../../../types';
import { MuscleCard } from './MuscleCard';
import { EmptyState } from '../../ui/EmptyState';
import { useFilterStore } from '../../../store/useFilterStore';

/** Ergebnisraster. Leerer Zustand statt einer leeren Liste. */
export function MuscleGrid({ muscles, query = '' }: { muscles: Muscle[]; query?: string }) {
  const reset = useFilterStore((s) => s.reset);

  if (muscles.length === 0) {
    return (
      <div role="status">
        <EmptyState
          icon="icSearch"
          title="Keine Muskeln gefunden"
          description="Kein Muskel passt zu Suchbegriff und Filtern. Setze die Filter zurück oder formuliere die Suche breiter."
          action={
            <button type="button" className="btn btn--primary" onClick={reset}>
              Filter zurücksetzen
            </button>
          }
        />
      </div>
    );
  }

  return (
    <ul className="muscle-grid">
      {muscles.map((muscle) => (
        <MuscleCard key={muscle.id} muscle={muscle} query={query} />
      ))}
    </ul>
  );
}
