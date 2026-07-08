import { beforeEach, describe, expect, it } from 'vitest';
import { roundAccuracy, useQuizStore } from './useQuizStore';

const KEY = 'multiple-choice::{"deckOnly":false,"regions":[],"subgroups":[]}';

function reset() {
  localStorage.clear();
  useQuizStore.getState().resetAllSeries();
}

describe('useQuizStore — Serien-Statistik', () => {
  beforeEach(reset);

  it('roundAccuracy rundet und schützt vor Division durch 0', () => {
    expect(roundAccuracy(7, 10)).toBe(70);
    expect(roundAccuracy(0, 0)).toBe(0);
  });

  it('commitRound summiert Runden/Antworten/Richtige und schreibt Historie', () => {
    const s = useQuizStore.getState();
    s.commitRound(KEY, 7, 10);
    s.commitRound(KEY, 9, 10);
    const stats = useQuizStore.getState().getSeriesStats(KEY);
    expect(stats.rounds).toBe(2);
    expect(stats.answers).toBe(20);
    expect(stats.correct).toBe(16);
    expect(stats.history).toEqual([
      { pct: 70, correct: 7, answered: 10 },
      { pct: 90, correct: 9, answered: 10 },
    ]);
  });

  it('kürzt die Historie auf die jüngsten 5 Runden', () => {
    const s = useQuizStore.getState();
    for (let i = 0; i < 6; i++) s.commitRound(KEY, i, 6);
    const stats = useQuizStore.getState().getSeriesStats(KEY);
    expect(stats.rounds).toBe(6);
    expect(stats.history).toHaveLength(5);
    expect(stats.history[0].correct).toBe(1); // Runde 0 (correct 0) wurde abgeschnitten
  });

  it('ignoriert Runden ohne Antworten', () => {
    useQuizStore.getState().commitRound(KEY, 0, 0);
    expect(useQuizStore.getState().getSeriesStats(KEY).rounds).toBe(0);
  });

  it('klemmt correct auf answered', () => {
    useQuizStore.getState().commitRound(KEY, 99, 10);
    expect(useQuizStore.getState().getSeriesStats(KEY).correct).toBe(10);
  });

  it('getAllSeriesStats liefert abgeleitete Genauigkeit', () => {
    useQuizStore.getState().commitRound(KEY, 6, 8);
    const all = useQuizStore.getState().getAllSeriesStats();
    expect(all).toHaveLength(1);
    expect(all[0].key).toBe(KEY);
    expect(all[0].accuracy).toBe(75);
  });

  it('resetSeries entfernt genau eine Serie', () => {
    const s = useQuizStore.getState();
    s.commitRound(KEY, 5, 10);
    s.commitRound('other::{}', 3, 5);
    s.resetSeries(KEY);
    expect(useQuizStore.getState().getSeriesStats(KEY).rounds).toBe(0);
    expect(useQuizStore.getState().getSeriesStats('other::{}').rounds).toBe(1);
  });

  it('persistiert unter dem Key mf.quizSeries', () => {
    useQuizStore.getState().commitRound(KEY, 5, 10);
    const raw = localStorage.getItem('mf.quizSeries');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.quizSeries[KEY]).toBeTruthy();
  });
});
