/* =========================================================================
   Statistik-Ableitung — reine Selektoren über den Store-Daten.
   src/data/stats.ts

   Alle Kennzahlen werden AUS den Stores abgeleitet (kein Doppel-State, ADR 0006).
   Reine Funktionen → unit-getestet; die UI ruft sie über `useStats`.
   ========================================================================= */

import { MASTERED_FACH } from '../persistence/leitner';
import { xpView, type XpView } from '../persistence/xp';
import type { FlashcardCard, QuizSeriesSection } from '../persistence/types';
import type { RegionId } from '../types';

export interface CardBreakdown {
  /** Fach ≥ 5. */
  mastered: number;
  /** Fach 2..4. */
  learning: number;
  /** Fach 1. */
  neu: number;
}

export interface QuizSummary {
  rounds: number;
  answers: number;
  correct: number;
  accuracy: number;
}

export interface StatsView {
  level: number;
  xp: XpView;
  deckSize: number;
  breakdown: CardBreakdown;
  /** Beherrschung 0..100 je Region (Anteil gemeisterter Karten im Deck der Region). */
  regionMastery: Record<RegionId, number>;
  quiz: QuizSummary;
}

type Cards = Record<string, FlashcardCard>;

/** Karten nach Lernstand aufschlüsseln. */
export function cardBreakdown(cards: Cards): CardBreakdown {
  let mastered = 0;
  let learning = 0;
  let neu = 0;
  for (const card of Object.values(cards)) {
    if (card.fach >= MASTERED_FACH) mastered++;
    else if (card.fach >= 2) learning++;
    else neu++;
  }
  return { mastered, learning, neu };
}

const EMPTY_MASTERY: Record<RegionId, number> = { upper: 0, lower: 0, trunk: 0, head: 0 };

/** Anteil gemeisterter Karten je Region (0..100), relativ zu den Karten im Deck. */
export function regionMastery(
  cards: Cards,
  regionOf: (name: string) => RegionId | undefined,
): Record<RegionId, number> {
  const total: Record<RegionId, number> = { ...EMPTY_MASTERY };
  const mastered: Record<RegionId, number> = { ...EMPTY_MASTERY };

  for (const [name, card] of Object.entries(cards)) {
    const region = regionOf(name);
    if (!region) continue;
    total[region]++;
    if (card.fach >= MASTERED_FACH) mastered[region]++;
  }

  const result: Record<RegionId, number> = { ...EMPTY_MASTERY };
  for (const region of Object.keys(result) as RegionId[]) {
    result[region] = total[region] > 0 ? Math.round((mastered[region] / total[region]) * 100) : 0;
  }
  return result;
}

/** Aggregierte Quiz-Statistik über alle Serien. */
export function quizSummary(quizSeries: QuizSeriesSection): QuizSummary {
  let rounds = 0;
  let answers = 0;
  let correct = 0;
  for (const entry of Object.values(quizSeries)) {
    rounds += entry.rounds;
    answers += entry.answers;
    correct += entry.correct;
  }
  return { rounds, answers, correct, accuracy: answers > 0 ? Math.round((correct / answers) * 100) : 0 };
}

export interface StatsInput {
  cards: Cards;
  totalXP: number;
  quizSeries: QuizSeriesSection;
  regionOf: (name: string) => RegionId | undefined;
}

/** Vollständige, abgeleitete Statistik-Sicht. */
export function computeStats({ cards, totalXP, quizSeries, regionOf }: StatsInput): StatsView {
  return {
    level: xpView(totalXP).level,
    xp: xpView(totalXP),
    deckSize: Object.keys(cards).length,
    breakdown: cardBreakdown(cards),
    regionMastery: regionMastery(cards, regionOf),
    quiz: quizSummary(quizSeries),
  };
}
