/* =========================================================================
   Woher die Quizfragen kommen (Etappe 8b) — reine Selektoren.
   src/data/quiz-pool.ts

   Die Filter gab es seit 8b in der **Lernsitzung**, aber nicht im **Quiz**. Der Haken
   war immer derselbe: Eine Quizfrage braucht vier Optionen. Wer nur drei Karten falsch
   beantwortet hat, bekäme keine einzige Frage.

   Entscheidung des Projektinhabers (2026-07-13): **Die Distraktoren kommen von außerhalb
   des Filters.** Damit ist der Haken weg — schon EINE passende Karte ergibt eine Frage,
   und die drei falschen Antworten holt sich der Generator aus dem ganzen Bestand.

   Zwei Töpfe, und sie sind ausdrücklich NICHT derselbe:
   - `questions`   — worüber gefragt wird (Filter greift hier)
   - `distractors` — woraus die falschen Antworten kommen (Filter greift hier NIE)

   Es wird dafür nichts Neues gespeichert: `totalWrong`, `lastSeen` und `difficult` stehen
   längst in der Karte (ADR 0002).
   ========================================================================= */

import { matchesCardFilter, type CardFilter } from './card-filter';
import type { QuizScope } from './quiz';
import type { FlashcardCard } from '../persistence/types';
import type { Muscle, RegionId } from '../types';

/** Warum es keine Fragen gibt. Codes, keine Sätze (das UI formuliert). */
export type QuizPoolBlocker =
  /** Der Karteikasten ist leer. */
  | 'emptyDeck'
  /** Karten gibt es, aber keine passt zum Filter (bzw. zur Region). */
  | 'nothingMatches';

export interface QuizPool {
  /** Muskeln, über die gefragt wird. */
  questions: Muscle[];
  /** Muskeln, aus denen die falschen Antworten kommen — **immer** der ganze Bestand. */
  distractors: Muscle[];
  blocker: QuizPoolBlocker | null;
}

export interface QuizPoolInput {
  muscles: readonly Muscle[];
  cards: Record<string, FlashcardCard>;
  /** Leer = alle Bereiche. Der Bereichsfilter grenzt **beide** Töpfe ein (V1-Verhalten). */
  regions?: readonly RegionId[];
  scope: QuizScope;
}

/** `QuizScope` → das Prädikat aus 8b. `'deck'` heißt: im Kasten, sonst egal. */
function cardFilterFor(scope: QuizScope): CardFilter {
  return scope === 'wrong' || scope === 'unseen' || scope === 'difficult' ? scope : 'all';
}

/**
 * Stellt die beiden Töpfe zusammen.
 *
 * Der **Bereichsfilter** (Region) grenzt beide ein — er sagt „ich lerne gerade die obere
 * Extremität", und dann wäre ein Fußmuskel als falsche Antwort albern. Der **Karten-Filter**
 * grenzt dagegen **nur die Fragen** ein: Er sagt etwas über *meinen Lernstand*, nicht über
 * den Stoff.
 */
export function quizPool({ muscles, cards, regions = [], scope }: QuizPoolInput): QuizPool {
  const distractors = regions.length
    ? muscles.filter((m) => regions.includes(m.region))
    : [...muscles];

  if (scope === 'all') {
    return {
      questions: distractors,
      distractors,
      blocker: distractors.length === 0 ? 'nothingMatches' : null,
    };
  }

  if (Object.keys(cards).length === 0) {
    return { questions: [], distractors, blocker: 'emptyDeck' };
  }

  const filter = cardFilterFor(scope);
  const questions = distractors.filter((m) => {
    const card = cards[m.nameLatin];
    return card !== undefined && matchesCardFilter(card, filter);
  });

  return {
    questions,
    distractors,
    blocker: questions.length === 0 ? 'nothingMatches' : null,
  };
}

/** Wie viele Fragen ein Umfang hergäbe — für die Beschriftung der Auswahl. */
export function quizPoolSize(input: QuizPoolInput): number {
  return quizPool(input).questions.length;
}
