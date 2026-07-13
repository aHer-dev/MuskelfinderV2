/* =========================================================================
   Prüfungsmodus + Debrief (Etappe 9c, Brücke B3) — reine Logik, kein UI.
   src/data/exam.ts

   Die App prüft, WIE geprüft wird: festes Set, kein Feedback zwischendurch, Zeit im
   Nacken. Der Wert steckt aber nicht im Timer, sondern in dem, was danach kommt:
   **aus jedem Fehler wird eine Karte.** Das ist Brücke B3.

   ⚠️ Diese Datei kennt `useQuizStore` NICHT und darf ihn nie kennen.
   `useQuizGame` committet bei jeder Runde in die V1-Quizserien
   (`commitRound(quizSeriesKey(…))`). Eine Prüfung, die dort hineinschreibt, würde die
   Trefferquote je Modus verfälschen — genau die Zahl, aus der die Statistik den
   „schwächster Modus"-Knopf ableitet — und den eingefrorenen Serien-Schlüssel
   verschmutzen (ADR 0002). Die Prüfung hat darum einen eigenen, nicht persistierten
   Store und schreibt in KEINE Serie.
   ========================================================================= */

import { checkAnswer, type AnswerCheck, type AnswerTarget } from './answer-check';
import { explainWrongAnswer, type Explanation } from './explain';
import { getMuscleById } from './loader';
import { createRng, eligibleFor, questionForMuscle, shuffle } from './quiz';
import type { Muscle, QuizQuestion, RegionId } from '../types';

/** Fragen einer vollständigen Prüfung. */
export const EXAM_SIZE = 20;
/** Unter dieser Kastengröße ist eine Prüfung keine Standortbestimmung, sondern Zufall. */
export const MIN_EXAM_CARDS = 5;
/** Zeitbudget je Frage. Sichtbar, aber nicht hetzend — der Timer beendet, er bestraft nicht. */
export const SECONDS_PER_ITEM = 60;

export function examDuration(itemCount: number): number {
  return itemCount * SECONDS_PER_ITEM;
}

/* ── Abrufformen ──────────────────────────────────────────────────────────
   E1 (2026-07-12): Real wird gemischt geprüft — schriftlich UND mündlich/praktisch.
   Trainiert wird der **freie Abruf**; MC ist die Einstiegsstufe, nicht das Ziel.
   Darum ist `recall` die häufigste Form im Plan, nicht eine unter vielen.
   ───────────────────────────────────────────────────────────────────────── */

/** `recall` = Freitext (kein Multiple Choice). Alles andere ist eine MC-Richtung. */
export type ExamForm =
  | 'recall'
  | 'function-to-muscle'
  | 'muscle-to-function'
  | 'innervation'
  | 'origin-insertion'
  | 'insertion-origin'
  | 'image';

export const EXAM_FORM_LABELS: Record<ExamForm, string> = {
  recall: 'Freier Abruf',
  'function-to-muscle': 'Funktion → Muskel',
  'muscle-to-function': 'Muskel → Funktion',
  innervation: 'Innervation',
  'origin-insertion': 'Ursprung → Ansatz',
  'insertion-origin': 'Ansatz → Ursprung',
  image: 'Bild → Muskel',
};

/** Wird reihum vergeben: 4 von 10 Fragen sind freier Abruf. */
const FORM_PLAN: readonly ExamForm[] = [
  'recall',
  'function-to-muscle',
  'image',
  'recall',
  'innervation',
  'muscle-to-function',
  'recall',
  'origin-insertion',
  'recall',
  'insertion-origin',
];

/**
 * Taugt der Muskel für den freien Abruf? Er muss mindestens EINEN Fakt hergeben,
 * sonst stünde die Frage ohne Anhalt da. (Gleiche Felder wie die Kartenrückseite,
 * `components/features/flashcards/facts.ts` — die Datenschicht darf sie nicht importieren.)
 */
function canRecall(muscle: Muscle): boolean {
  return [
    muscle.functionDescription,
    muscle.innervation,
    muscle.segments,
    muscle.origin,
    muscle.insertion,
  ].some((value) => value.trim() !== '');
}

/* ── Das Set ─────────────────────────────────────────────────────────────── */

export type ExamItem =
  /** Freitext: die Fakten stehen da, der Name muss selbst kommen. */
  | { kind: 'recall'; id: string; form: 'recall'; muscleId: string; nameLatin: string }
  /** Multiple Choice — die Frage stammt aus dem bestehenden Generator. */
  | { kind: 'choice'; id: string; form: ExamForm; muscleId: string; nameLatin: string; question: QuizQuestion };

export type ExamBlocker = 'emptyDeck' | 'tooFewCards';

export interface ExamSet {
  items: ExamItem[];
  /** Gesetzt → es gibt keine Prüfung, und das UI sagt ehrlich warum. */
  blocker?: ExamBlocker;
}

export interface BuildExamInput {
  /** Der ganze Bestand — daraus kommen die **Distraktoren**. */
  muscles: readonly Muscle[];
  /** `nameLatin` der Karten im Kasten — daraus kommen die **Fragen**. */
  deck: readonly string[];
  count?: number;
  rng?: () => number;
}

/**
 * Stellt das Prüfungsset zusammen: gefragt wird nur, was im Kasten liegt; die falschen
 * Antworten kommen aus dem ganzen Bestand.
 *
 * Ist ein Muskel für seine zugeloste Form untauglich (kein Bild, keine Innervation),
 * wird er zum freien Abruf — nicht zu einer Frage mit leerem Feld.
 */
export function buildExam({
  muscles,
  deck,
  count = EXAM_SIZE,
  rng = createRng(Date.now()),
}: BuildExamInput): ExamSet {
  const byName = new Map(muscles.map((m) => [m.nameLatin, m]));
  // ADR 0002 §2: Karten sind nach `nameLatin` geschlüsselt, Dubletten sind DIESELBE Karte.
  const candidates = [...new Set(deck)]
    .map((name) => byName.get(name))
    .filter((m): m is Muscle => m !== undefined);

  if (candidates.length === 0) return { items: [], blocker: 'emptyDeck' };
  if (candidates.length < MIN_EXAM_CARDS) return { items: [], blocker: 'tooFewCards' };

  const chosen = shuffle(candidates, rng).slice(0, Math.min(count, candidates.length));

  return {
    items: chosen.map((muscle, index) => {
      const form = usableForm(FORM_PLAN[index % FORM_PLAN.length], muscle);
      const id = `e${index}-${muscle.id}`;

      if (form === 'recall') {
        return { kind: 'recall', id, form, muscleId: muscle.id, nameLatin: muscle.nameLatin };
      }
      return {
        kind: 'choice',
        id,
        form,
        muscleId: muscle.id,
        nameLatin: muscle.nameLatin,
        question: questionForMuscle(muscle, form, muscles, rng, id),
      };
    }),
  };
}

/**
 * Die geplante Form, falls der Muskel sie hergibt — sonst freier Abruf.
 * (Ein Muskel ohne Bild bekommt keine Bildfrage, sondern eine, die er beantworten kann.)
 */
function usableForm(planned: ExamForm, muscle: Muscle): ExamForm {
  const fallback: ExamForm = canRecall(muscle) ? 'recall' : 'function-to-muscle';
  if (planned === 'recall') return fallback;
  return eligibleFor([muscle], planned).length > 0 ? planned : fallback;
}

/* ── Die Auswertung ──────────────────────────────────────────────────────── */

export interface ExamOutcome {
  item: ExamItem;
  muscle: Muscle;
  answered: boolean;
  correct: boolean;
  /** Freitext: das Urteil. Ein Tippfehler (`almost`) zählt als richtig — wie in der Sitzung. */
  check?: AnswerCheck;
  /** Freitext: was getippt wurde. */
  typed?: string;
  /** MC: die gewählte Option. */
  selectedId?: string;
  /** MC-Fehler: der Kontrastsatz aus 7e — das Debrief erklärt, es zählt nicht nur. */
  explanation?: Explanation;
}

export interface ExamTally {
  answered: number;
  correct: number;
}

export interface ExamReport {
  /** Fragen im Set. */
  total: number;
  /** Beantwortete Fragen — abbrechen verliert nichts, es verkürzt nur. */
  answered: number;
  correct: number;
  outcomes: ExamOutcome[];
  missed: ExamOutcome[];
  /** `nameLatin` der verpassten Muskeln, dedupliziert. **Genau das seedet das Debrief.** */
  missedNames: string[];
  /** Schwächste zuerst — dort lohnt sich die Zeit. */
  byRegion: Array<{ region: RegionId; tally: ExamTally }>;
  byForm: Array<{ form: ExamForm; tally: ExamTally }>;
  /** Benannte Verwechslungen aus den MC-Fehlern (7e). */
  confusions: Explanation[];
}

export interface GradeExamInput {
  items: readonly ExamItem[];
  /** itemId → Options-id (MC) bzw. getippter Text (Freitext). */
  answers: Readonly<Record<string, string>>;
  /** Der ganze Bestand: Korpus für den Freitext UND Auflösung der Muskel-ids. */
  muscles: readonly Muscle[];
  /** Überschreibbar für Tests. */
  resolve?: (id: string) => Muscle | undefined;
}

/** Anteil richtig — kleiner ist schwächer. Ohne Antwort neutral (1), damit nichts Leeres oben steht. */
function ratio(tally: ExamTally): number {
  return tally.answered === 0 ? 1 : tally.correct / tally.answered;
}

function bump(map: Map<string, ExamTally>, key: string, correct: boolean): void {
  const tally = map.get(key) ?? { answered: 0, correct: 0 };
  tally.answered += 1;
  if (correct) tally.correct += 1;
  map.set(key, tally);
}

/**
 * Wertet die Prüfung aus — nach Struktur, nicht als Note.
 *
 * ⚠️ Der Freitext wird mit **Korpus** geprüft. Ohne ihn misst `checkAnswer` nur gegen das
 * Ziel und winkt fremde Muskeln als Tippfehler durch („mylohyoideus" für „stylohyoideus").
 */
export function gradeExam({
  items,
  answers,
  muscles,
  resolve = getMuscleById,
}: GradeExamInput): ExamReport {
  const corpus: AnswerTarget[] = muscles.map((m) => ({ nameLatin: m.nameLatin, nameDE: m.nameDE }));

  const outcomes: ExamOutcome[] = [];
  const regions = new Map<string, ExamTally>();
  const forms = new Map<string, ExamTally>();

  for (const item of items) {
    const muscle = resolve(item.muscleId);
    if (!muscle) continue;

    const raw = answers[item.id];
    const answered = typeof raw === 'string' && raw.trim() !== '';

    if (item.kind === 'recall') {
      const check = answered ? checkAnswer(raw, muscle, corpus) : undefined;
      const correct = check !== undefined && check.verdict !== 'wrong';
      outcomes.push({ item, muscle, answered, correct, check, typed: answered ? raw : undefined });
      if (answered) {
        bump(regions, muscle.region, correct);
        bump(forms, item.form, correct);
      }
      continue;
    }

    const correct = answered && raw === item.question.correctId;
    outcomes.push({
      item,
      muscle,
      answered,
      correct,
      selectedId: answered ? raw : undefined,
      explanation:
        answered && !correct
          ? (explainWrongAnswer({ question: item.question, selectedId: raw, resolve }) ?? undefined)
          : undefined,
    });
    if (answered) {
      bump(regions, muscle.region, correct);
      bump(forms, item.form, correct);
    }
  }

  const missed = outcomes.filter((o) => o.answered && !o.correct);

  return {
    total: items.length,
    answered: outcomes.filter((o) => o.answered).length,
    correct: outcomes.filter((o) => o.correct).length,
    outcomes,
    missed,
    missedNames: [...new Set(missed.map((o) => o.muscle.nameLatin))],
    byRegion: [...regions.entries()]
      .map(([region, tally]) => ({ region: region as RegionId, tally }))
      .sort((a, b) => ratio(a.tally) - ratio(b.tally)),
    byForm: [...forms.entries()]
      .map(([form, tally]) => ({ form: form as ExamForm, tally }))
      .sort((a, b) => ratio(a.tally) - ratio(b.tally)),
    confusions: missed
      .map((o) => o.explanation)
      .filter((e): e is Explanation => e !== undefined && e.curated),
  };
}
