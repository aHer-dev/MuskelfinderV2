/* =========================================================================
   Abrufstufe aus der Leitner-Box (Etappe 8a) — reine Ableitung.
   src/data/recall.ts

   ADR 0008: Die Abrufhärte wächst mit der Beherrschung, und sie wird aus der
   Box ABGELEITET — nirgends gespeichert. Es gibt keinen zweiten Zähler, der
   mit dem Fach auseinanderlaufen könnte, und ein importiertes V1-Backup bekommt
   die Leiter geschenkt: Fach 6 heißt Fach 6, egal woher es kommt.

   Wiedererkennen ist nicht Können — deshalb endet die Leiter nicht bei der
   Auswahl, sondern beim freien Produzieren des Namens.
   ========================================================================= */

import { MAX_FACH, MIN_FACH } from '../persistence/leitner';

export type RecallStage =
  /** Fach 1–2: wiedererkennen — Multiple Choice (im Quiz gebaut). */
  | 'recognize'
  /** Fach 3–4: wiedererkennen im Kontext — Bild ↔ Name (im Quiz gebaut). */
  | 'match'
  /** Fach 5–6: abrufen mit Selbstbewertung — die klassische Lernkarte. */
  | 'recall'
  /** Fach 7: produzieren — Namen tippen, ohne Auswahl daneben. */
  | 'produce';

export function recallStage(fach: number): RecallStage {
  const clamped = Math.min(MAX_FACH, Math.max(MIN_FACH, Math.floor(fach)));
  if (clamped <= 2) return 'recognize';
  if (clamped <= 4) return 'match';
  if (clamped <= 6) return 'recall';
  return 'produce';
}
