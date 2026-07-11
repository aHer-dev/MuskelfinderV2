/* =========================================================================
   useQuizStore — persistierte Quiz-Serien-Statistik (ADR 0002 §1).
   src/store/useQuizStore.ts

   Hält die `quizSeries`-Sektion des Backups: pro opakem Modus-Key eine Serie
   (rounds/answers/correct + Historie der jüngsten 5 Runden). Modus-Keys werden
   verbatim erhalten. Eigener V2-Key `mf.quizSeries`.

   Nicht-Ziel (Etappe 3d): der In-Session-Quiz-Ablauf (Fragen, Auswertung).
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QUIZ_HISTORY_LIMIT, sanitizeQuizSeriesEntry } from '../persistence/sanitize';
import type { QuizSeriesEntry, QuizSeriesSection } from '../persistence/types';

/** Genauigkeit in Prozent (gerundet), 0 bei 0 Antworten — V1-identisch. */
export function roundAccuracy(correct: number, answered: number): number {
  return answered > 0 ? Math.round((correct / answered) * 100) : 0;
}

function emptyEntry(): QuizSeriesEntry {
  return { rounds: 0, answers: 0, correct: 0, history: [] };
}

export interface SeriesStatsView extends QuizSeriesEntry {
  key: string;
  accuracy: number;
}

interface QuizState {
  quizSeries: QuizSeriesSection;

  /** Eine abgeschlossene Runde in die Serie `seriesKey` einbuchen. */
  commitRound: (seriesKey: string, correct: number, answered: number) => void;
  /** Statistik einer Serie (leere Serie, wenn unbekannt). */
  getSeriesStats: (seriesKey: string) => QuizSeriesEntry;
  /** Alle Serien mit abgeleiteter Genauigkeit. */
  getAllSeriesStats: () => SeriesStatsView[];
  /** Eine Serie zurücksetzen. */
  resetSeries: (seriesKey: string) => void;

  /* Persistenz-Bridge. */
  replaceQuizSeries: (section: QuizSeriesSection) => void;
  resetAllSeries: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizSeries: {},

      commitRound: (seriesKey, correct, answered) => {
        if (!seriesKey || answered <= 0) return;
        set((s) => {
          const prev = s.quizSeries[seriesKey] ?? emptyEntry();
          const safeAnswered = Math.max(0, Math.floor(answered));
          const safeCorrect = Math.min(safeAnswered, Math.max(0, Math.floor(correct)));
          const round = { pct: roundAccuracy(safeCorrect, safeAnswered), correct: safeCorrect, answered: safeAnswered };
          const entry: QuizSeriesEntry = {
            rounds: prev.rounds + 1,
            answers: prev.answers + safeAnswered,
            correct: prev.correct + safeCorrect,
            history: [...prev.history, round].slice(-QUIZ_HISTORY_LIMIT),
          };
          return { quizSeries: { ...s.quizSeries, [seriesKey]: entry } };
        });
      },

      getSeriesStats: (seriesKey) => {
        const entry = get().quizSeries[seriesKey];
        return entry ? sanitizeQuizSeriesEntry(entry) : emptyEntry();
      },

      getAllSeriesStats: () =>
        Object.entries(get().quizSeries).map(([key, entry]) => {
          const clean = sanitizeQuizSeriesEntry(entry);
          return { key, ...clean, accuracy: roundAccuracy(clean.correct, clean.answers) };
        }),

      resetSeries: (seriesKey) => {
        set((s) => {
          if (!(seriesKey in s.quizSeries)) return {};
          const quizSeries = { ...s.quizSeries };
          delete quizSeries[seriesKey];
          return { quizSeries };
        });
      },

      replaceQuizSeries: (section) => set({ quizSeries: section }),
      resetAllSeries: () => set({ quizSeries: {} }),
    }),
    {
      name: 'mf.quizSeries',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ quizSeries: state.quizSeries }),
    },
  ),
);
