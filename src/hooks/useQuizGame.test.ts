import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useQuizGame } from './useQuizGame';
import { quizSeriesKey } from '../data/quiz';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';

describe('useQuizGame', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
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
