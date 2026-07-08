import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { advanceQueue, useFlashcardSession } from './useFlashcardSession';
import { useProgressStore } from '../store/useProgressStore';

describe('advanceQueue (rein)', () => {
  it('richtig/falsch entfernen die aktuelle Karte', () => {
    expect(advanceQueue(['A', 'B', 'C'], 'correct')).toEqual(['B', 'C']);
    expect(advanceQueue(['A', 'B'], 'wrong')).toEqual(['B']);
  });

  it('unsicher schiebt die Karte ans Ende', () => {
    expect(advanceQueue(['A', 'B', 'C'], 'unsure')).toEqual(['B', 'C', 'A']);
    expect(advanceQueue(['A'], 'unsure')).toEqual(['A']);
  });

  it('leere Warteschlange bleibt leer', () => {
    expect(advanceQueue([], 'correct')).toEqual([]);
  });
});

describe('useFlashcardSession (gegen useProgressStore)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
  });

  it('startet mit allen fälligen Karten', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());
    expect(result.current.total).toBe(2);
    expect(result.current.current).toBe('A');
    expect(result.current.done).toBe(false);
  });

  it('Bewertung verschiebt Fach + vergibt XP, unsicher re-queued', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());

    act(() => result.current.rate('correct')); // A: Fach 1→2 (+3 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.current).toBe('B');

    act(() => result.current.rate('unsure')); // B bleibt, ans Ende (+2 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.current).toBe('B');

    act(() => result.current.rate('correct')); // B: Fach 1→2 (+3 XP)
    expect(result.current.done).toBe(true);
    expect(result.current.reviewed).toBe(2);

    const store = useProgressStore.getState();
    expect(store.getCardState('A')?.fach).toBe(2);
    expect(store.getCardState('B')?.fach).toBe(2);
    expect(store.xp.totalXP).toBe(8); // 3 + 2 + 3
    expect(result.current.xpEarned).toBe(8);
  });
});
