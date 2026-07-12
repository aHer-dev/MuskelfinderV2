/* =========================================================================
   useTodayPlan — der Tagesplan, abgeleitet aus dem Karteikasten (kein Doppel-State).
   src/hooks/useTodayPlan.ts

   Die Engine (`data/today.ts`) ist rein; dieser Hook reicht ihr nur den Store.
   `examDate` (7c) und `lookupCounts` (7d) kommen hier dazu, sobald es sie gibt.
   ========================================================================= */

import { useMemo } from 'react';
import { getTodayPlan, type TodayPlan } from '../data/today';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';

export function useTodayPlan(): TodayPlan {
  const cards = useProgressStore((s) => s.flashcards.cards);
  const examDate = useProfileStore((s) => s.examDate);

  return useMemo(() => getTodayPlan({ cards, examDate }), [cards, examDate]);
}
