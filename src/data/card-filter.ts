/* =========================================================================
   Session-Filter (Etappe 8b) — reine Selektoren über den Karten.
   src/data/card-filter.ts

   Gezielt an den Lücken üben statt am ganzen Deck. Drei Filter, mehr nicht.

   Es wird dafür NICHTS Neues gespeichert: Alles steht schon in der Karte
   (`totalWrong`, `lastSeen`, `difficult` — ADR 0002). Der Produktplan behauptet,
   die Daten lägen in `useQuizStore` — das stimmt nicht, der hält nur Aggregate je
   Serien-Key und weiß nichts über einzelne Muskeln.

   WICHTIG: Ein Filter grenzt die **fälligen** Karten ein, er hebt die Fälligkeit
   nicht auf. Die Leitner-Box bleibt die einzige Wahrheit über den Zeitpunkt — sonst
   hätte man zwei Terminpläne, die auseinanderlaufen. Wer eine Karte sofort wieder
   sehen will, markiert sie als schwierig; die ist dann immer fällig (`isDue`).
   ========================================================================= */

import type { FlashcardCard } from '../persistence/types';

export type CardFilter =
  /** Kein Filter — alles, was fällig ist. */
  | 'all'
  /** Schon mindestens einmal falsch beantwortet. */
  | 'wrong'
  /** Noch nie bewertet worden. */
  | 'unseen'
  /** Von Hand als schwierig markiert. */
  | 'difficult';

const FILTERS: readonly CardFilter[] = ['all', 'wrong', 'unseen', 'difficult'];

export function isCardFilter(value: unknown): value is CardFilter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}

/** Das Prädikat je Filter — alles aus der Karte abgeleitet, nichts zusätzlich gespeichert. */
export function matchesCardFilter(card: FlashcardCard, filter: CardFilter): boolean {
  switch (filter) {
    case 'wrong':
      return card.totalWrong > 0;
    case 'unseen':
      return card.lastSeen === null;
    case 'difficult':
      return card.difficult;
    case 'all':
      return true;
  }
}

export interface ApplyFilterInput {
  cards: Record<string, FlashcardCard>;
  /** Kandidaten in der gewünschten Reihenfolge (z. B. die fälligen Karten). */
  candidates: readonly string[];
  filter: CardFilter;
}

/**
 * Filtert eine Kandidatenliste — **ohne ihre Reihenfolge anzutasten**. Damit bleibt
 * die Vorpriorisierung aus 7a/7b (`SessionOptions.names`) erhalten: Der Filter nimmt
 * Karten weg, er sortiert nicht um.
 *
 * Namen ohne Karte im Kasten fallen raus (ein Handoff kann veraltet sein).
 */
export function applyCardFilter({ cards, candidates, filter }: ApplyFilterInput): string[] {
  return candidates.filter((name) => {
    const card = cards[name];
    return card !== undefined && matchesCardFilter(card, filter);
  });
}
