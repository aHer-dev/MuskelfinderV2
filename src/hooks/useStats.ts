/* =========================================================================
   useStats — abgeleitete Statistik aus den Stores (kein Doppel-State).
   src/hooks/useStats.ts
   ========================================================================= */

import { useMemo } from 'react';
import { getMuscleByLatinName } from '../data';
import { computeStats, type StatsView } from '../data/stats';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';

export function useStats(): StatsView {
  const cards = useProgressStore((s) => s.flashcards.cards);
  const totalXP = useProgressStore((s) => s.xp.totalXP);
  const quizSeries = useQuizStore((s) => s.quizSeries);

  return useMemo(
    () =>
      computeStats({
        cards,
        totalXP,
        quizSeries,
        regionOf: (name) => getMuscleByLatinName(name)?.region,
      }),
    [cards, totalXP, quizSeries],
  );
}
