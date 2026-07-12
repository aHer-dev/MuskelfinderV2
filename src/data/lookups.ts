/* =========================================================================
   Nachgeschlagen → Lernvorschlag (Etappe 7d, Brücke B1) — reine Selektoren.
   src/data/lookups.ts

   „Zuletzt nachgeschlagen = noch nicht gewusst." Was hier herauskommt, ist die
   Liste der Lücken, die die Nutzerin selbst offengelegt hat, indem sie sie
   nachgeschlagen hat. Muskeln, die schon im Karteikasten liegen, sind keine
   Lücke mehr und fallen raus.
   ========================================================================= */

import type { FlashcardCard, LookupsSection } from '../persistence/types';

/** Wie viele Vorschläge der Heute-Screen höchstens zeigt. */
export const LOOKUP_SUGGESTION_LIMIT = 5;

export interface LookupSuggestion {
  /** `nameLatin` — Schlüssel von Karten und Zählern (ADR 0002 §2). */
  name: string;
  count: number;
  lastLookup: string;
}

export interface LookupSuggestionsInput {
  lookups: LookupsSection;
  /** Der Karteikasten — was hier drin ist, wird nicht mehr vorgeschlagen. */
  cards: Record<string, FlashcardCard>;
  limit?: number;
}

/**
 * Die Vorschläge für „Zuletzt nachgeschlagen": häufigste zuerst, bei Gleichstand
 * das zuletzt Aufgeschlagene. Deterministisch — gleicher Zustand, gleiche Liste.
 */
export function lookupSuggestions({
  lookups,
  cards,
  limit = LOOKUP_SUGGESTION_LIMIT,
}: LookupSuggestionsInput): LookupSuggestion[] {
  return Object.entries(lookups.entries)
    .filter(([name]) => !(name in cards))
    .map(([name, entry]) => ({ name, count: entry.count, lastLookup: entry.lastLookup }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.lastLookup.localeCompare(a.lastLookup) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
