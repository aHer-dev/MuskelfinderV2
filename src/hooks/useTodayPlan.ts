/* =========================================================================
   useTodayPlan — der Tagesplan, abgeleitet aus dem Karteikasten (kein Doppel-State).
   src/hooks/useTodayPlan.ts

   Die Engine (`data/today.ts`) ist rein; dieser Hook reicht ihr nur den Store.
   `examDate` (7c) und `lookupCounts` (7d) kommen hier dazu, sobald es sie gibt.
   ========================================================================= */

import { useMemo } from 'react';
import { getTodayPlan, type TodayPlan } from '../data/today';
import { useLookupStore } from '../store/useLookupStore';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';

export function useTodayPlan(): TodayPlan {
  const cards = useProgressStore((s) => s.flashcards.cards);
  const examDate = useProfileStore((s) => s.examDate);
  const entries = useLookupStore((s) => s.lookups.entries);

  return useMemo(() => {
    // Was oft nachgeschlagen wurde, kommt in der Empfehlung nach oben (Brücke B1).
    const lookupCounts: Record<string, number> = {};
    for (const [name, entry] of Object.entries(entries)) lookupCounts[name] = entry.count;

    return getTodayPlan({ cards, examDate, lookupCounts });
  }, [cards, examDate, entries]);
}
