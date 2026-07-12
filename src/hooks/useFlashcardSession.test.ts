import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { advanceQueue, buildQueue, readSessionHandoff, useFlashcardSession } from './useFlashcardSession';
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

  it('beginnt im Setup (nicht gestartet) und startet erst über start()', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());
    expect(result.current.started).toBe(false);
    expect(result.current.current).toBeNull();

    act(() => result.current.start({ limit: 0, scope: 'all' }));
    expect(result.current.started).toBe(true);
    expect(result.current.total).toBe(2);
    expect(result.current.current).toBe('A');
    expect(result.current.done).toBe(false);
  });

  it('Kartenlimit kürzt die Sitzung', () => {
    useProgressStore.getState().addCards(['A', 'B', 'C', 'D']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 2, scope: 'all' }));
    expect(result.current.total).toBe(2);
  });

  it('Bewertung verschiebt Fach + vergibt XP, unsicher re-queued', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));

    act(() => result.current.rate('correct')); // A: Fach 1→2 (+3 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.correct).toBe(1);
    expect(result.current.current).toBe('B');

    act(() => result.current.rate('unsure')); // B bleibt, ans Ende (+2 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.unsure).toBe(1);
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

  it('exit() kehrt ins Setup zurück', () => {
    useProgressStore.getState().addCards(['A']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));
    expect(result.current.started).toBe(true);
    act(() => result.current.exit());
    expect(result.current.started).toBe(false);
    expect(result.current.current).toBeNull();
  });
});

describe('readSessionHandoff (Übergabe von /heute, 7b)', () => {
  it('nimmt eine gültige Auswahl an und ergänzt die Voreinstellungen', () => {
    expect(readSessionHandoff({ start: { names: ['A', 'B'] } })).toEqual({
      names: ['A', 'B'],
      limit: 0,
      scope: 'all',
    });
  });

  it('weist alles zurück, was nicht wie eine Auswahl aussieht', () => {
    // Der Router-State kommt aus der History — er kann beliebig sein.
    expect(readSessionHandoff(null)).toBeNull();
    expect(readSessionHandoff('los')).toBeNull();
    expect(readSessionHandoff({})).toBeNull();
    expect(readSessionHandoff({ start: {} })).toBeNull();
    expect(readSessionHandoff({ start: { names: [] } })).toBeNull();
    expect(readSessionHandoff({ start: { names: [1, 2] } })).toBeNull();
  });

  it('übernimmt nur bekannte Bereiche, sonst „alle"', () => {
    expect(readSessionHandoff({ start: { names: ['A'], scope: 'head' } })?.scope).toBe('head');
    expect(readSessionHandoff({ start: { names: ['A'], scope: 'bein' } })?.scope).toBe('all');
  });
});

describe('buildQueue mit vorgegebener Auswahl (7b)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
  });

  it('behält die Reihenfolge des Tagesplans bei', () => {
    useProgressStore.getState().addCards(['A', 'B', 'C']);
    expect(buildQueue({ names: ['C', 'A', 'B'], limit: 0, scope: 'all' })).toEqual(['C', 'A', 'B']);
  });

  it('lässt Namen weg, die nicht (mehr) fällig oder gar nicht im Kasten sind', () => {
    useProgressStore.getState().addCards(['A']);
    expect(buildQueue({ names: ['A', 'Unbekannt'], limit: 0, scope: 'all' })).toEqual(['A']);
  });
});
