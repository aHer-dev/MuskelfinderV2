/* =========================================================================
   useExamStore — die laufende Prüfung (Etappe 9c).
   src/store/useExamStore.ts

   **Bewusst NICHT persistiert.** Eine Prüfung ist eine Momentaufnahme; wer sie
   abbricht, hat sie abgebrochen. Was bleiben soll, bleibt ohnehin: die verpassten
   Muskeln landen als Karten im `useProgressStore`.

   ⚠️ Dieser Store importiert `useQuizStore` NICHT. Der Quiz-Hook committet jede Runde
   in die V1-Serien (`commitRound(quizSeriesKey(…))`); eine Prüfung, die dort
   hineinschreibt, verfälscht die Trefferquote je Modus und verschmutzt den
   eingefrorenen Serien-Schlüssel (ADR 0002). Die Prüfung schreibt in keine Serie.
   ========================================================================= */

import { create } from 'zustand';
import type { ExamBlocker, ExamItem, ExamSet } from '../data/exam';

export type ExamPhase = 'idle' | 'running' | 'done';

interface ExamState {
  phase: ExamPhase;
  items: ExamItem[];
  /** itemId → Options-id (MC) bzw. getippter Text (Freitext). */
  answers: Record<string, string>;
  index: number;
  /** Ende der Prüfung als Zeitstempel (ms). `null`, solange keine läuft. */
  endsAt: number | null;
  blocker: ExamBlocker | null;

  start: (set: ExamSet, durationSeconds: number) => void;
  /** Antwort setzen — **ohne jede Rückmeldung**. Änderbar, solange die Prüfung läuft. */
  answer: (itemId: string, value: string) => void;
  go: (index: number) => void;
  next: () => void;
  prev: () => void;
  /** Abgeben oder Zeit abgelaufen. Beides wertet aus, was beantwortet ist. */
  finish: () => void;
  reset: () => void;
}

const IDLE = {
  phase: 'idle' as ExamPhase,
  items: [] as ExamItem[],
  answers: {} as Record<string, string>,
  index: 0,
  endsAt: null,
  blocker: null,
};

export const useExamStore = create<ExamState>()((set, get) => ({
  ...IDLE,

  start: (examSet, durationSeconds) => {
    if (examSet.blocker) {
      set({ ...IDLE, blocker: examSet.blocker });
      return;
    }
    set({
      ...IDLE,
      phase: 'running',
      items: examSet.items,
      endsAt: Date.now() + durationSeconds * 1000,
    });
  },

  answer: (itemId, value) => {
    if (get().phase !== 'running') return;
    set((s) => ({ answers: { ...s.answers, [itemId]: value } }));
  },

  go: (index) => {
    const { items } = get();
    if (index < 0 || index >= items.length) return;
    set({ index });
  },

  next: () => set((s) => ({ index: Math.min(s.items.length - 1, s.index + 1) })),
  prev: () => set((s) => ({ index: Math.max(0, s.index - 1) })),

  finish: () => {
    if (get().phase !== 'running') return;
    set({ phase: 'done', endsAt: null });
  },

  reset: () => set({ ...IDLE }),
}));
