import { describe, expect, it } from 'vitest';
import {
  cardBreakdown,
  computeStats,
  nextMasteryMilestone,
  quizByMode,
  quizSummary,
  regionMastery,
  weakestQuizMode,
} from './stats';
import type { FlashcardCard, QuizSeriesSection } from '../persistence/types';
import type { RegionId } from '../types';

function card(fach: number): FlashcardCard {
  return {
    fach,
    nextDue: '2026-07-08T00:00:00.000Z',
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}

describe('cardBreakdown', () => {
  it('teilt in gemeistert (≥5), in Arbeit (2..4) und neu (1)', () => {
    const cards = { a: card(1), b: card(3), c: card(5), d: card(7), e: card(1) };
    expect(cardBreakdown(cards)).toEqual({ mastered: 2, learning: 1, neu: 2 });
  });

  it('leeres Deck ergibt Nullen', () => {
    expect(cardBreakdown({})).toEqual({ mastered: 0, learning: 0, neu: 0 });
  });
});

describe('regionMastery', () => {
  const regionOf = (name: string): RegionId | undefined => {
    const map: Record<string, RegionId> = {
      'M. deltoideus': 'upper',
      'M. biceps': 'upper',
      'M. gluteus': 'lower',
    };
    return map[name];
  };

  it('berechnet den Anteil gemeisterter Karten je Region', () => {
    const cards = {
      'M. deltoideus': card(5), // upper, gemeistert
      'M. biceps': card(2), // upper, nicht
      'M. gluteus': card(6), // lower, gemeistert
    };
    const mastery = regionMastery(cards, regionOf);
    expect(mastery.upper).toBe(50);
    expect(mastery.lower).toBe(100);
    expect(mastery.trunk).toBe(0);
    expect(mastery.head).toBe(0);
  });

  it('ignoriert Karten ohne Muskel-Datensatz', () => {
    const mastery = regionMastery({ 'unbekannt': card(5) }, regionOf);
    expect(mastery).toEqual({ upper: 0, lower: 0, trunk: 0, head: 0 });
  });
});

describe('quizSummary', () => {
  it('aggregiert alle Serien und leitet die Trefferquote ab', () => {
    const series: QuizSeriesSection = {
      'a::x': { rounds: 2, answers: 10, correct: 7, history: [] },
      'b::y': { rounds: 1, answers: 10, correct: 8, history: [] },
    };
    expect(quizSummary(series)).toEqual({ rounds: 3, answers: 20, correct: 15, accuracy: 75 });
  });

  it('leere Serien ergeben 0% ohne Division durch 0', () => {
    expect(quizSummary({})).toEqual({ rounds: 0, answers: 0, correct: 0, accuracy: 0 });
  });
});

describe('quizByMode', () => {
  it('fasst Serien mit gleichem Modus (versch. Filter) zusammen, sortiert nach Antworten', () => {
    const series: QuizSeriesSection = {
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}': { rounds: 1, answers: 4, correct: 4, history: [] },
      'innervation::{"deckOnly":false,"regions":["upper"],"subgroups":[]}': { rounds: 1, answers: 6, correct: 3, history: [] },
      'origin-insertion::{"deckOnly":false,"regions":[],"subgroups":[]}': { rounds: 2, answers: 20, correct: 10, history: [] },
    };
    const byMode = quizByMode(series);
    expect(byMode).toHaveLength(2);
    // origin-insertion hat mehr Antworten → zuerst.
    expect(byMode[0]).toMatchObject({ mode: 'origin-insertion', label: 'Ursprung → Ansatz', answers: 20, correct: 10, accuracy: 50 });
    // innervation zusammengefasst: 10 Antworten, 7 richtig → 70%.
    expect(byMode[1]).toMatchObject({ mode: 'innervation', answers: 10, correct: 7, accuracy: 70 });
  });

  it('unbekannter Modus fällt auf den rohen Key zurück', () => {
    const series: QuizSeriesSection = { 'image-match::foo': { rounds: 1, answers: 2, correct: 1, history: [] } };
    expect(quizByMode(series)[0].label).toBe('image-match');
  });
});

describe('weakestQuizMode', () => {
  const mode = (m: string, correct: number, answers: number) => ({
    mode: m,
    label: m,
    rounds: 1,
    answers,
    correct,
    accuracy: Math.round((correct / answers) * 100),
  })

  it('nennt den Modus mit der schlechtesten Quote', () => {
    const worst = weakestQuizMode([mode('image', 18, 20), mode('innervation', 4, 20)])
    expect(worst?.mode).toBe('innervation')
  })

  it('schweigt bei nur einem gespielten Modus — „der schwächste" waere dort „der einzige"', () => {
    expect(weakestQuizMode([mode('image', 5, 20)])).toBeNull()
    expect(weakestQuizMode([])).toBeNull()
  })

  it('nimmt bei Gleichstand den mit mehr Antworten (die belastbarere Zahl)', () => {
    const worst = weakestQuizMode([mode('image', 5, 10), mode('innervation', 10, 20)])
    expect(worst?.mode).toBe('innervation')
  })
})

describe('nextMasteryMilestone', () => {
  it('liefert den nächsten Meilenstein oder null', () => {
    expect(nextMasteryMilestone(0)).toBe(1);
    expect(nextMasteryMilestone(1)).toBe(5);
    expect(nextMasteryMilestone(7)).toBe(10);
    expect(nextMasteryMilestone(100)).toBeNull();
  });
});

describe('computeStats', () => {
  it('leitet Level, Deckgröße und Kennzahlen konsistent ab', () => {
    const stats = computeStats({
      cards: { 'M. deltoideus': card(5), 'M. biceps': card(1) },
      totalXP: 50, // → Level 2
      quizSeries: { 'a::x': { rounds: 1, answers: 4, correct: 3, history: [] } },
      regionOf: () => 'upper',
    });
    expect(stats.level).toBe(2);
    expect(stats.deckSize).toBe(2);
    expect(stats.breakdown).toEqual({ mastered: 1, learning: 0, neu: 1 });
    expect(stats.quiz.accuracy).toBe(75);
    expect(stats.regionMastery.upper).toBe(50);
  });
});
