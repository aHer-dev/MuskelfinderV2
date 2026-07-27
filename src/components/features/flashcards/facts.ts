import type { Muscle } from '../../../types';

export interface Fact {
  label: string;
  value: string;
}

/**
 * Fakten der Lernkarten-Rückseite. Leere Felder fallen raus — `segments` fehlt bei
 * 28 von 150 Muskeln, sonst stünde dort ein Label ohne Wert. (Bei 16 davon ist das
 * richtig so: Hirnnerv, es gibt keine Segmente — siehe `src/data/segments.ts`.)
 *
 * Der Stern am Label markiert einen Wert, der noch nicht im Lehrbuch nachgeschlagen
 * ist. Er steht am **Label**, nicht am Wert, damit niemand ihn für einen Teil der
 * Segmentangabe hält.
 */
export const UNGEPRUEFT_MARKE = ' *';

export function facts(muscle: Muscle): Fact[] {
  return [
    { label: 'Funktion', value: muscle.functionDescription },
    { label: 'Innervation', value: muscle.innervation },
    {
      label: muscle.segmentsUngeprueft ? `Segmente${UNGEPRUEFT_MARKE}` : 'Segmente',
      value: muscle.segments,
    },
    { label: 'Ursprung', value: muscle.origin },
    { label: 'Ansatz', value: muscle.insertion },
  ].filter((f) => f.value.trim() !== '');
}
