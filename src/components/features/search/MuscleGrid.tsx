import type { Muscle } from '../../../types';
import { MuscleCard } from './MuscleCard';

/** Ergebnisraster. Leerer Zustand statt einer leeren Liste. */
export function MuscleGrid({ muscles }: { muscles: Muscle[] }) {
  if (muscles.length === 0) {
    return (
      <p className="muscle-grid__empty" role="status">
        Keine Muskeln gefunden. Suchbegriff oder Filter anpassen.
      </p>
    );
  }

  return (
    <ul className="muscle-grid">
      {muscles.map((muscle) => (
        <MuscleCard key={muscle.id} muscle={muscle} />
      ))}
    </ul>
  );
}
