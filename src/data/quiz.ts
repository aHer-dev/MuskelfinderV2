/* =========================================================================
   Quiz-Generierung — reine Datenschicht (unit-getestet, deterministisch mit RNG).
   src/data/quiz.ts

   Erzeugt Multiple-Choice-Fragen (4 Optionen) aus den Muskeldaten. Der
   Serien-Key folgt der V1-Form `"<mode>::<filterSignatur>"`, damit die
   persistierte Serien-Statistik zu ADR 0002 kompatibel bleibt.
   ========================================================================= */

import type { Muscle, QuizMode, QuizQuestion, RegionId } from '../types';

/** Deterministischer PRNG (mulberry32) — für reproduzierbare Tests. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Wählt bis zu `n` verschiedene Distraktor-Labels (≠ correct). */
function pickDistractors(
  pool: readonly string[],
  correct: string,
  n: number,
  rng: () => number,
): string[] {
  const unique = [...new Set(pool)].filter((label) => label !== correct && label.trim() !== '');
  return shuffle(unique, rng).slice(0, n);
}

const MODE_CATEGORY: Record<QuizMode, string> = {
  'function-to-muscle': 'Funktion → Muskel',
  'muscle-to-function': 'Muskel → Funktion',
  innervation: 'Innervation',
  'origin-insertion': 'Ursprung → Ansatz',
  'insertion-origin': 'Ansatz → Ursprung',
  image: 'Bild → Muskel',
};

/**
 * Serien-Key im V1-Format `<mode>::{"deckOnly":…,"regions":…,"subgroups":…}`.
 * Ohne Bereichsfilter (`regions = []`) exakt der bisherige Key → ADR-0002-kompatibel;
 * ein Bereichsfilter erzeugt einen zusätzlichen (neuen) Serien-Schlüssel.
 */
export function quizSeriesKey(mode: QuizMode, regions: RegionId[] = []): string {
  const signature = JSON.stringify({
    deckOnly: false,
    regions: [...regions].sort(),
    subgroups: [],
  });
  return `${mode}::${signature}`;
}

interface QuestionSpec {
  prompt: string;
  correctLabel: string;
  distractorPool: string[];
  imageUrl?: string;
}

/** Muskeln, die für den Modus taugliche Daten haben. */
function eligible(muscles: readonly Muscle[], mode: QuizMode): Muscle[] {
  if (mode === 'innervation') return muscles.filter((m) => m.innervation.trim() !== '');
  if (mode === 'muscle-to-function') return muscles.filter((m) => m.functionDescription.trim() !== '');
  if (mode === 'image') return muscles.filter((m) => m.images.length > 0);
  if (mode === 'origin-insertion' || mode === 'insertion-origin') {
    return muscles.filter((m) => m.origin.trim() !== '' && m.insertion.trim() !== '');
  }
  return [...muscles];
}

function specFor(muscle: Muscle, mode: QuizMode, all: readonly Muscle[]): QuestionSpec {
  switch (mode) {
    case 'muscle-to-function':
      return {
        prompt: muscle.nameLatin,
        correctLabel: muscle.functionDescription,
        distractorPool: all.map((m) => m.functionDescription),
      };
    case 'innervation':
      return {
        prompt: muscle.nameLatin,
        correctLabel: muscle.innervation,
        distractorPool: all.map((m) => m.innervation),
      };
    case 'origin-insertion':
      return {
        prompt: muscle.origin,
        correctLabel: muscle.insertion,
        distractorPool: all.map((m) => m.insertion),
      };
    case 'insertion-origin':
      return {
        prompt: muscle.insertion,
        correctLabel: muscle.origin,
        distractorPool: all.map((m) => m.origin),
      };
    case 'image':
      return {
        prompt: 'Welcher Muskel ist abgebildet?',
        correctLabel: muscle.nameLatin,
        distractorPool: all.map((m) => m.nameLatin),
        imageUrl: muscle.images[0]?.url,
      };
    case 'function-to-muscle':
    default:
      return {
        prompt: muscle.functionDescription,
        correctLabel: muscle.nameLatin,
        distractorPool: all.map((m) => m.nameLatin),
      };
  }
}

/**
 * Erzeugt bis zu `count` MC-Fragen für den Modus. Jede Frage hat 4 Optionen
 * (1 richtig + bis zu 3 Distraktoren), Reihenfolge gemischt.
 */
export function generateQuiz(
  muscles: readonly Muscle[],
  mode: QuizMode,
  count = 10,
  rng: () => number = createRng(Date.now()),
): QuizQuestion[] {
  const pool = eligible(muscles, mode);
  const chosen = shuffle(pool, rng).slice(0, Math.min(count, pool.length));

  return chosen.map((muscle, qIndex) => {
    const spec = specFor(muscle, mode, muscles);
    const distractors = pickDistractors(spec.distractorPool, spec.correctLabel, 3, rng);
    const labels = shuffle([spec.correctLabel, ...distractors], rng);
    const qid = `q${qIndex}-${muscle.id}`;

    const options = labels.map((label, oIndex) => ({ id: `${qid}-o${oIndex}`, label }));
    const correctId = options.find((option) => option.label === spec.correctLabel)?.id ?? options[0].id;

    return {
      id: qid,
      mode,
      category: MODE_CATEGORY[mode],
      prompt: spec.prompt,
      imageUrl: spec.imageUrl,
      options,
      correctId,
    };
  });
}
