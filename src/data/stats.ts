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

export interface QuizModeStat {
  /** Roher Modus-Key (Prefix vor „::"), z. B. „origin-insertion". */
  mode: string;
  label: string;
  rounds: number;
  answers: number;
  correct: number;
  accuracy: number;
}

/** Anzeige-Labels je Quiz-Modus; unbekannte (z. B. aus V1-Backups) fallen auf den Key zurück. */
const QUIZ_MODE_LABELS: Record<string, string> = {
  'function-to-muscle': 'Funktion → Muskel',
  'muscle-to-function': 'Muskel → Funktion',
  innervation: 'Innervation',
  'origin-insertion': 'Ursprung → Ansatz',
  'insertion-origin': 'Ansatz → Ursprung',
  image: 'Bild → Muskel',
};

function quizModeLabel(mode: string): string {
  return QUIZ_MODE_LABELS[mode] ?? mode;
}

/** Meilensteine für gemeisterte Karten (V1). */
export const MASTERY_MILESTONES = [1, 5, 10, 25, 50, 100] as const;

/** Nächster noch nicht erreichter Meilenstein oder null (alle erreicht). */
export function nextMasteryMilestone(mastered: number): number | null {
  return MASTERY_MILESTONES.find((m) => m > mastered) ?? null;
}

export interface StatsView {
  level: number;
  xp: XpView;
  deckSize: number;
  breakdown: CardBreakdown;
  /** Beherrschung 0..100 je Region (Anteil gemeisterter Karten im Deck der Region). */
  regionMastery: Record<RegionId, number>;
  quiz: QuizSummary;
  /** Quiz-Bilanz je Modus (leer, solange nichts gespielt wurde). */
  quizByMode: QuizModeStat[];
  /** Nächster Meilenstein gemeisterter Karten oder null (alle erreicht). */
  masteryNext: number | null;
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

/**
 * Quiz-Bilanz je Modus (V1 „Quiz-Bilanz je Typ"). Serien mit gleichem Modus-Prefix,
 * aber unterschiedlichem Filter, werden zusammengefasst. Sortiert nach Antwortzahl.
 */
export function quizByMode(quizSeries: QuizSeriesSection): QuizModeStat[] {
  const acc = new Map<string, { rounds: number; answers: number; correct: number }>();
  for (const [key, entry] of Object.entries(quizSeries)) {
    const mode = key.split('::')[0];
    const a = acc.get(mode) ?? { rounds: 0, answers: 0, correct: 0 };
    a.rounds += entry.rounds;
    a.answers += entry.answers;
    a.correct += entry.correct;
    acc.set(mode, a);
  }
  return [...acc.entries()]
    .map(([mode, a]) => ({
      mode,
      label: quizModeLabel(mode),
      rounds: a.rounds,
      answers: a.answers,
      correct: a.correct,
      accuracy: a.answers > 0 ? Math.round((a.correct / a.answers) * 100) : 0,
    }))
    .sort((x, y) => y.answers - x.answers);
}

export interface StatsInput {
  cards: Cards;
  totalXP: number;
  quizSeries: QuizSeriesSection;
  regionOf: (name: string) => RegionId | undefined;
}

/** Vollständige, abgeleitete Statistik-Sicht. */
export function computeStats({ cards, totalXP, quizSeries, regionOf }: StatsInput): StatsView {
  const breakdown = cardBreakdown(cards);
  return {
    level: xpView(totalXP).level,
    xp: xpView(totalXP),
    deckSize: Object.keys(cards).length,
    breakdown,
    regionMastery: regionMastery(cards, regionOf),
    quiz: quizSummary(quizSeries),
    quizByMode: quizByMode(quizSeries),
    masteryNext: nextMasteryMilestone(breakdown.mastered),
  };
}
