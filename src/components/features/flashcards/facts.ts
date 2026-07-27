import { fachfelder } from '../../../data/muscle-fields';
import type { Muscle } from '../../../types';

export interface Fact {
  label: string;
  value: string;
}

/* `UNGEPRUEFT_MARKE` wird durchgereicht, weil Tests und Legenden sie brauchen —
   definiert ist sie in `data/muscle-fields.ts`, zusammen mit der Regel, wann sie
   gesetzt wird. */
export { UNGEPRUEFT_MARKE } from '../../../data/muscle-fields';

/**
 * Fakten der Lernkarten-Rückseite. Leere Felder fallen raus — `segments` fehlt bei
 * 28 von 150 Muskeln, sonst stünde dort ein Label ohne Wert. (Bei 16 davon ist das
 * richtig so: Hirnnerv, es gibt keine Segmente — siehe `src/data/segments.ts`.)
 *
 * **Reihenfolge und Stern kommen aus `data/muscle-fields.ts`** und werden hier
 * nicht noch einmal behauptet: Sie müssen dieselben sein wie auf der Detailseite,
 * weil beim Auswendiglernen die Position mitgelernt wird.
 */
export function facts(muscle: Muscle): Fact[] {
  return fachfelder(muscle, muscle.segmentsUngeprueft === true)
    .map(({ label, value }) => ({ label, value }))
    .filter((f) => f.value.trim() !== '');
}
