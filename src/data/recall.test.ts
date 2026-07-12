import { describe, expect, it } from 'vitest';
import { recallStage, type RecallStage } from './recall';

describe('recallStage', () => {
  const LADDER: Array<[fach: number, stage: RecallStage]> = [
    [1, 'recognize'],
    [2, 'recognize'],
    [3, 'match'],
    [4, 'match'],
    [5, 'recall'],
    [6, 'recall'],
    [7, 'produce'],
  ];

  it.each(LADDER)('Fach %i → %s', (fach, stage) => {
    expect(recallStage(fach)).toBe(stage);
  });

  it('die Härte steigt monoton — kein Fach fällt zurück', () => {
    const order: RecallStage[] = ['recognize', 'match', 'recall', 'produce'];
    const ranks = LADDER.map(([fach]) => order.indexOf(recallStage(fach)));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('fängt Werte außerhalb der Box ab, statt undefined zu liefern', () => {
    expect(recallStage(0)).toBe('recognize');
    expect(recallStage(-3)).toBe('recognize');
    expect(recallStage(99)).toBe('produce');
    expect(recallStage(6.9)).toBe('recall');
  });
});
