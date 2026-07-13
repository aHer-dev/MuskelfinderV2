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

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Ein Antwort-Kandidat: das Label und der Muskel, aus dessen Daten es stammt. */
interface Candidate {
  label: string;
  muscleId: string;
}

/**
 * Wählt bis zu `n` verschiedene Distraktoren (≠ correct). Jeder trägt seinen Muskel mit —
 * ohne diese Herkunft könnte die Erklärung (7e) den gewählten Distraktor nur noch über
 * seinen Text zurückraten.
 */
function pickDistractors(
  pool: readonly Candidate[],
  correct: string,
  n: number,
  rng: () => number,
): Candidate[] {
  const seen = new Set<string>([correct]);
  const unique: Candidate[] = [];
  for (const candidate of pool) {
    if (candidate.label.trim() === '' || seen.has(candidate.label)) continue;
    seen.add(candidate.label);
    unique.push(candidate);
  }
  return shuffle(unique, rng).slice(0, n);
}

const MODE_CATEGORY: Record<QuizMode, string> = {
  'function-to-muscle': 'Funktion → Muskel',
  'muscle-to-function': 'Muskel → Funktion',
  'function-mixed': 'Funktion ↔ Muskel',
  innervation: 'Innervation',
  'origin-insertion': 'Ursprung → Ansatz',
  'insertion-origin': 'Ansatz → Ursprung',
  'origin-insertion-mixed': 'Ursprung ↔ Ansatz',
  image: 'Bild → Muskel',
  'name-image': 'Name → Bild',
  'image-mixed': 'Bild ↔ Name',
  'group-odd-one-out': 'Funktionelle Gruppe',
};

/** „Gemischt"-Modi lösen je Frage zufällig auf eine ihrer konkreten Richtungen auf. */
const MIXED_SUBMODES: Partial<Record<QuizMode, QuizMode[]>> = {
  'function-mixed': ['function-to-muscle', 'muscle-to-function'],
  'origin-insertion-mixed': ['origin-insertion', 'insertion-origin'],
  'image-mixed': ['image', 'name-image'],
};

/** Bekannter Quizmodus? V1-Backups können Serien-Keys enthalten, die es heute nicht gibt. */
export function isQuizMode(value: unknown): value is QuizMode {
  return typeof value === 'string' && Object.hasOwn(MODE_CATEGORY, value);
}

/**
 * Router-State, mit dem die Statistik (8c) direkt in einen Modus springt — dasselbe
 * Muster wie die Sitzungs-Übergabe aus 7b: validiert, nicht gecastet. Der State kommt
 * aus der History und kann alles sein.
 */
export function readQuizHandoff(state: unknown): QuizMode | null {
  if (typeof state !== 'object' || state === null) return null;
  const mode = (state as { mode?: unknown }).mode;
  return isQuizMode(mode) ? mode : null;
}

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
  distractorPool: Candidate[];
  imageUrl?: string;
}

/** Kandidatenliste aus einem Muskelfeld — Label plus Herkunft. */
function candidates(all: readonly Muscle[], field: (m: Muscle) => string): Candidate[] {
  return all.map((m) => ({ label: field(m), muscleId: m.id }));
}

/** Muskeln, die für den Modus taugliche Daten haben. */
function eligible(muscles: readonly Muscle[], mode: QuizMode): Muscle[] {
  const sub = MIXED_SUBMODES[mode]?.[0] ?? mode; // gemischte teilen die Anforderung der Submodi
  if (sub === 'innervation') return muscles.filter((m) => m.innervation.trim() !== '');
  if (sub === 'muscle-to-function') return muscles.filter((m) => m.functionDescription.trim() !== '');
  if (sub === 'image' || sub === 'name-image') return muscles.filter((m) => m.images.length > 0);
  if (sub === 'origin-insertion' || sub === 'insertion-origin') {
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
        distractorPool: candidates(all, (m) => m.functionDescription),
      };
    case 'innervation':
      return {
        prompt: muscle.nameLatin,
        correctLabel: muscle.innervation,
        distractorPool: candidates(all, (m) => m.innervation),
      };
    case 'origin-insertion':
      return {
        prompt: muscle.origin,
        correctLabel: muscle.insertion,
        distractorPool: candidates(all, (m) => m.insertion),
      };
    case 'insertion-origin':
      return {
        prompt: muscle.insertion,
        correctLabel: muscle.origin,
        distractorPool: candidates(all, (m) => m.origin),
      };
    case 'image':
      return {
        prompt: 'Welcher Muskel ist abgebildet?',
        correctLabel: muscle.nameLatin,
        distractorPool: candidates(all, (m) => m.nameLatin),
        imageUrl: muscle.images[0]?.url,
      };
    case 'function-to-muscle':
    default:
      return {
        prompt: muscle.functionDescription,
        correctLabel: muscle.nameLatin,
        distractorPool: candidates(all, (m) => m.nameLatin),
      };
  }
}

/** Frage mit Text-Optionen (alle Modi außer „name-image"). */
function textQuestion(
  muscle: Muscle,
  concreteMode: QuizMode,
  all: readonly Muscle[],
  rng: () => number,
  qid: string,
  displayMode: QuizMode,
): QuizQuestion {
  const spec = specFor(muscle, concreteMode, all);
  const distractors = pickDistractors(spec.distractorPool, spec.correctLabel, 3, rng);
  const picks = shuffle([{ label: spec.correctLabel, muscleId: muscle.id }, ...distractors], rng);
  const options = picks.map((candidate, oIndex) => ({
    id: `${qid}-o${oIndex}`,
    label: candidate.label,
    muscleId: candidate.muscleId,
  }));
  const correctId = options.find((o) => o.label === spec.correctLabel)?.id ?? options[0].id;
  return {
    id: qid,
    mode: displayMode,
    concreteMode,
    category: MODE_CATEGORY[concreteMode], // konkrete Richtung anzeigen (auch in „Gemischt")
    muscleId: muscle.id,
    prompt: spec.prompt,
    imageUrl: spec.imageUrl,
    options,
    correctId,
  };
}

/** Frage mit Bild-Optionen: Name als Prompt, vier Muskelbilder zur Auswahl (Name → Bild). */
function imageOptionQuestion(
  muscle: Muscle,
  all: readonly Muscle[],
  rng: () => number,
  qid: string,
  displayMode: QuizMode,
): QuizQuestion {
  const pool = all.filter((m) => m.images.length > 0 && m.id !== muscle.id);
  const distractors = shuffle(pool, rng).slice(0, 3);
  const picks = shuffle([muscle, ...distractors], rng);
  const options = picks.map((m, oIndex) => ({
    id: `${qid}-o${oIndex}`,
    label: m.nameLatin,
    imageUrl: m.images[0]?.url,
    muscleId: m.id,
  }));
  const correctId = options.find((o) => o.label === muscle.nameLatin)?.id ?? options[0].id;
  return {
    id: qid,
    mode: displayMode,
    concreteMode: 'name-image',
    category: MODE_CATEGORY['name-image'], // konkrete Richtung, auch innerhalb „Bild ↔ Name"
    muscleId: muscle.id,
    prompt: muscle.nameLatin,
    options,
    correctId,
  };
}

/**
 * Erzeugt bis zu `count` MC-Fragen für den Modus. Jede Frage hat 4 Optionen
 * (1 richtig + bis zu 3 Distraktoren), Reihenfolge gemischt. „Gemischt"-Modi lösen
 * je Frage zufällig auf eine konkrete Richtung auf; „name-image" nutzt Bild-Optionen.
 */
export function generateQuiz(
  muscles: readonly Muscle[],
  mode: QuizMode,
  count = 10,
  rng: () => number = createRng(Date.now()),
): QuizQuestion[] {
  const pool = eligible(muscles, mode);
  const chosen = shuffle(pool, rng).slice(0, Math.min(count, pool.length));
  const submodes = MIXED_SUBMODES[mode];

  return chosen.map((muscle, qIndex) => {
    const concrete = submodes ? submodes[Math.floor(rng() * submodes.length)] : mode;
    const qid = `q${qIndex}-${muscle.id}`;
    return concrete === 'name-image'
      ? imageOptionQuestion(muscle, muscles, rng, qid, mode)
      : textQuestion(muscle, concrete, muscles, rng, qid, mode);
  });
}
