import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useQuizGame } from './useQuizGame';
import { quizSeriesKey } from '../data/quiz';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';

describe('useQuizGame', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useQuizStore.getState().resetAllSeries();
  });

  it('wertet eine Serie aus, committet sie und vergibt XP', () => {
    const { result } = renderHook(() => useQuizGame('innervation', 3));
    expect(result.current.total).toBe(3);

    for (let i = 0; i < 3; i++) {
      act(() => result.current.answer(result.current.question!.correctId));
      expect(result.current.phase).toBe('revealed');
      act(() => result.current.next());
    }

    expect(result.current.phase).toBe('finished');
    expect(result.current.result).toEqual({
      total: 3,
      correct: 3,
      bestStreak: 3,
      score: 30,
      xpEarned: 6, // 3× richtig · 2 XP; keine Streak-Meilensteine bei max. 3
    });

    // Serie wurde kompatibel persistiert.
    const series = useQuizStore.getState().getSeriesStats(quizSeriesKey('innervation'));
    expect(series).toMatchObject({ rounds: 1, answers: 3, correct: 3 });
    // XP floss in den gemeinsamen Fortschritts-Store.
    expect(useProgressStore.getState().xp.totalXP).toBe(6);
  });

  it('setzt die Serie bei einer falschen Antwort zurück', () => {
    const { result } = renderHook(() => useQuizGame('innervation', 3));

    act(() => result.current.answer(result.current.question!.correctId));
    expect(result.current.streak).toBe(1);
    act(() => result.current.next());

    const wrong = result.current.question!.options.find(
      (o) => o.id !== result.current.question!.correctId,
    )!;
    act(() => result.current.answer(wrong.id));
    expect(result.current.streak).toBe(0);
    expect(result.current.correctCount).toBe(1);
  });
});

/* ── Uhr und Klick werten NIE beide dieselbe Frage (UX-Review 2026-07-26) ──
   `phase` allein reichte nicht: Der Intervall-Callback der Uhr läuft AUSSERHALB des
   React-Ereignisflusses. Setzt er `phase='revealed'`, sieht ein Klick, der im selben Frame
   eintrifft, in `answer()` noch das alte `phase` aus seinem Render-Closure.

   Genau diese Gleichzeitigkeit ist hier nachgebaut: **zwei Aufrufe in EINEM `act`-Block**
   teilen dasselbe Closure, so wie Uhr und Klick im selben Frame. Ohne den Ref-Riegel
   sammelt `results` einen Eintrag zu viel und `correctCount` zählt doppelt. */
describe('useQuizGame — eine Frage wird genau einmal gewertet', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useQuizStore.getState().resetAllSeries();
  });

  it('zwei Antworten im selben Frame ergeben EIN Ergebnis, nicht zwei', () => {
    const { result } = renderHook(() => useQuizGame('innervation', 3));
    const richtig = result.current.question!.correctId;

    act(() => {
      result.current.answer(richtig);
      result.current.answer(richtig); // dasselbe Closure — `phase` ist hier noch 'answering'
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.correctCount).toBe(1);
    expect(result.current.score).toBe(10);
  });

  it('die Ergebnisliste ist am Ende nie länger als die Runde', () => {
    const { result } = renderHook(() => useQuizGame('innervation', 3));
    for (let i = 0; i < 3; i++) {
      act(() => {
        const id = result.current.question!.correctId;
        result.current.answer(id);
        result.current.answer(id);
      });
      act(() => result.current.next());
    }
    expect(result.current.result).toMatchObject({ total: 3, correct: 3 });
    expect(result.current.results).toHaveLength(3);
  });
});
