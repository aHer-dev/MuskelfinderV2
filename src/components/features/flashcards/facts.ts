import type { Muscle } from '../../../types';

export interface Fact {
  label: string;
  value: string;
}

/**
 * Fakten der Lernkarten-Rückseite. Leere Felder fallen raus — `segments` fehlt bei
 * 48 von 150 Muskeln (V1-Datenstand), sonst stünde dort ein Label ohne Wert.
 */
export function facts(muscle: Muscle): Fact[] {
  return [
    { label: 'Funktion', value: muscle.functionDescription },
    { label: 'Innervation', value: muscle.innervation },
    { label: 'Segmente', value: muscle.segments },
    { label: 'Ursprung', value: muscle.origin },
    { label: 'Ansatz', value: muscle.insertion },
  ].filter((f) => f.value.trim() !== '');
}
