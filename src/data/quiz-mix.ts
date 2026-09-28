/* =========================================================================
   Quiz-Mix — die fälligen Karten als gemischte Quizfragen (Etappe 16, ADR 0014).
   src/data/quiz-mix.ts

   Die zweite Lernform neben der Lernkarte. DIESELBE Warteschlange (`buildQueue`),
   dieselbe Tagesdosis, dasselbe Kartenlimit — nur kommt jede Karte als
   Multiple-Choice-Frage, und zwar ZWEIMAL, in zwei verschiedenen Fragearten:
   Bild → Muskel, Name → Bild, Ursprung ↔ Ansatz, Funktion ↔ Muskel, Innervation.

   Die Frage selbst baut der bestehende Generator (`questionForMuscle`) — mit
   derselben Zwillingssperre (`gueltigeAntworten`) und denselben Distraktoren aus
   der Nachbarschaft wie im freien Quiz. Hier wird nur entschieden, WELCHE Frageart
   welcher Platz bekommt, und welche Karten gar keine Quizfrage werden.

   Reine Funktionen, deterministisch mit RNG. Kein Store-Import.
   ========================================================================= */

import { getMuscleByCardKey, getMuscles } from './loader';
import { createRng, eligibleFor, questionForMuscle } from './quiz';
import { recallStage } from './recall';
import type { FlashcardCard } from '../persistence/types';
import type { Muscle, QuizMode, QuizQuestion } from '../types';

/** Wie die fälligen Karten abgefragt werden. */
export type Lernform =
  /** Die Lernkarte: aufdecken, selbst bewerten (ab Fach 7: Namen tippen). */
  | 'karten'
  /** Jede Karte als Quizfrage, die Fragearten gemischt. */
  | 'quiz';

/**
 * Anzeigename je Lernform — an EINER Stelle (dieselbe Regel wie `mode-labels.ts`):
 * Der Umschalter auf `/lernkarten`, der Knopf auf `/heute` und die Anleitung nennen die
 * Form gleich, sonst sähe dieselbe Übung nach drei verschiedenen aus.
 */
export const LERNFORM_LABELS: Record<Lernform, string> = {
  karten: 'Karteikarten',
  quiz: 'Quiz-Mix',
};

export const LERNFORMEN = Object.keys(LERNFORM_LABELS) as Lernform[];

export function isLernform(value: unknown): value is Lernform {
  return typeof value === 'string' && Object.hasOwn(LERNFORM_LABELS, value);
}

/**
 * So oft kommt eine Karte im Quiz-Mix dran — und so oft muss sie RICHTIG sein, bevor sie ein
 * Fach weiterrückt (Projektinhaber, 2026-09-28). Auf der Lernkarte reicht einmal.
 *
 * Der Grund ist die Abrufhärte (ADR 0008): Aus vier Antworten die richtige zu erkennen ist
 * leichter, als sie selbst abzurufen. Zweimal, in zwei verschiedenen Fragearten und mit einer
 * ganzen Runde Abstand, gleicht das aus — wer den Muskel nur am Bild erkennt, aber seinen
 * Ursprung nicht kennt, rückt nicht vor.
 */
export const FRAGEN_JE_KARTE = 2;

/**
 * Die Fragearten des Mix. Jede fragt genau EINEN Muskel ab — nur so kann die Antwort in
 * dessen Karte zählen.
 *
 * Nicht dabei: die Gruppenfrage (9a) — sie fragt nach einem Zusammenhang, nicht nach einer
 * Karte. Und die „Gemischt"-Modi: gemischt wird hier, über alle Familien hinweg.
 */
export const MIX_FORMEN = [
  'image',
  'name-image',
  'origin-insertion',
  'insertion-origin',
  'function-to-muscle',
  'muscle-to-function',
  'innervation',
] as const satisfies readonly QuizMode[];

export type MixForm = (typeof MIX_FORMEN)[number];

/**
 * Welche Fragearten ein Muskel hergibt. 47 von 150 haben kein Bild — für sie gibt es keine
 * Bildfrage, sondern eine der fünf anderen. Die Regel ist dieselbe wie im freien Quiz
 * (`eligibleFor`), keine zweite Fassung.
 */
export function formenFuer(muscle: Muscle): MixForm[] {
  return MIX_FORMEN.filter((form) => eligibleFor([muscle], form).length > 0);
}

/**
 * Verteilt die Fragearten auf die Plätze einer Sitzung — gleich oft je Art, nie zweimal
 * dieselbe hintereinander, und **die Fragen zu EINEM Muskel nie in derselben Art**
 * (`karte[i]` sagt, zu welcher Karte Platz i gehört; sofern die Muskeln es hergeben).
 *
 * **Zwei Schritte, und die Reihenfolge ist der Kern.** Der erste Wurf ging die Warteschlange
 * einfach von vorn durch und nahm je Platz die bisher seltenste Art. Gemessen am ganzen
 * Kasten: Bildfragen 15-mal, alle anderen 24-mal. Die 42 Muskeln ohne Bild (Kopf und Hals)
 * stehen im Bestand am Ende — bis dahin hatten die Bildfragen keinen Vorsprung, und danach
 * konnte sie niemand mehr aufholen. Wer nur nach vorn schaut, verteilt nach Datenreihenfolge.
 *
 * 1. **Wie oft jede Art drankommt:** die eingeschränktesten Plätze zuerst (ohne Bild = fünf
 *    statt sieben Arten), jeder bekommt die bisher seltenste seiner Arten, die seine Karte
 *    nicht schon hat.
 * 2. **Wo sie drankommt:** Stehen zwei gleiche Arten nebeneinander, tauscht der Platz seine
 *    Art mit einem anderen, für den beide Arten taugen. Ein Tausch ändert die Zählung nicht.
 */
export function verteileFormen(
  muscles: readonly Muscle[],
  rng: () => number,
  karte: readonly string[] = muscles.map((_, index) => String(index)),
): MixForm[] {
  const moeglich = muscles.map(formenFuer);
  const formen: MixForm[] = [];
  const zaehler = new Map<MixForm, number>(MIX_FORMEN.map((form) => [form, 0]));
  const alle = muscles.map((_, index) => index);
  const geschwister = alle.map((i) => alle.filter((j) => j !== i && karte[j] === karte[i]));

  // 1. Zählung — `sort` ist stabil, innerhalb einer Klasse bleibt die Warteschlangen-Folge.
  const eingeschraenkteZuerst = [...alle].sort((a, b) => moeglich[a].length - moeglich[b].length);
  for (const index of eingeschraenkteZuerst) {
    const vergeben = new Set(geschwister[index].map((j) => formen[j]));
    const frei = moeglich[index].filter((form) => !vergeben.has(form));
    const kandidaten = frei.length > 0 ? frei : moeglich[index];
    const wenigste = Math.min(...kandidaten.map((form) => zaehler.get(form) ?? 0));
    const seltenste = kandidaten.filter((form) => (zaehler.get(form) ?? 0) === wenigste);
    const form = seltenste[Math.floor(rng() * seltenste.length)];
    formen[index] = form;
    zaehler.set(form, wenigste + 1);
  }

  // 2. Nachbarschaft — gelesen wird der Stand MIT vollzogenem Tausch.
  const passt = (index: number) =>
    moeglich[index].includes(formen[index]) &&
    formen[index - 1] !== formen[index] &&
    formen[index + 1] !== formen[index] &&
    geschwister[index].every((j) => formen[j] !== formen[index]);
  const tausche = (a: number, b: number) => {
    [formen[a], formen[b]] = [formen[b], formen[a]];
  };

  for (let i = 1; i < formen.length; i++) {
    if (formen[i] !== formen[i - 1]) continue;
    // Erst ein Platz dahinter; nur wenn keiner taugt, einer davor.
    const partner = [...alle.slice(i + 1), ...alle.slice(0, Math.max(0, i - 1))];
    for (const j of partner) {
      if (formen[j] === formen[i]) continue;
      tausche(i, j);
      if (passt(i) && passt(j)) break;
      tausche(i, j);
    }
  }

  return formen;
}

/**
 * Ein Platz in der Sitzung: eine Quizfrage zu einer Karte — oder `frage: null`, dann kommt
 * die Karte als Lernkarte (siehe `baueQuizMix`).
 */
export interface QuizPlatz {
  /** Kartenschlüssel. Eine Quiz-Karte steht zweimal in der Liste, eine Lernkarte einmal. */
  name: string;
  frage: QuizQuestion | null;
}

export interface QuizMixInput {
  /** Die Warteschlange der Sitzung (Kartenschlüssel), in ihrer Reihenfolge. */
  names: readonly string[];
  /** Der Karteikasten — das Fach entscheidet, ob eine Karte überhaupt Quizfrage wird. */
  cards: Record<string, FlashcardCard>;
  /** Kartenschlüssel → Muskel (ADR 0012: nicht der Anzeigename). Überschreibbar für Tests. */
  resolve?: (key: string) => Muscle | undefined;
  /** Woraus die falschen Antworten kommen — immer der ganze Bestand (8b). */
  distractors?: readonly Muscle[];
  rng?: () => number;
}

/**
 * Baut die Plätze einer Quiz-Mix-Sitzung, in der Reihenfolge, in der sie drankommen.
 *
 * **Runden statt Paare.** Runde 1 geht die Warteschlange einmal durch, Runde 2 fragt jede
 * Quiz-Karte ein zweites Mal, in derselben Folge. Zwischen den beiden Fragen zu einem Muskel
 * liegt damit die ganze Runde — stünden sie direkt hintereinander, prüfte die zweite nur das
 * Kurzzeitgedächtnis.
 *
 * **Keine Quizfrage bekommen** — sie stehen nur in Runde 1, als Lernkarte:
 * - Karten im letzten Fach (Stufe `produce`, ADR 0008). Dort wird der Name frei getippt,
 *   und das bleibt auch im Quiz-Mix so. Sonst käme ein Muskel mit vier Antworten zur Wahl
 *   bis ganz nach oben, und die Anleitung („weiter hinten musst du den Namen frei
 *   eintippen") stimmte nur noch für die halbe App. Wiedererkennen ist nicht Können.
 * - Karten, deren Schlüssel auf keinen Muskel auflöst, oder deren Muskel keine Frageart
 *   hergibt. Beides kommt im heutigen Bestand nicht vor; die Sitzung soll daran trotzdem
 *   nicht hängenbleiben.
 */
export function baueQuizMix({
  names,
  cards,
  resolve = getMuscleByCardKey,
  distractors = getMuscles(),
  rng = createRng(Date.now()),
}: QuizMixInput): QuizPlatz[] {
  const quizMuskel = new Map<string, Muscle>();
  for (const name of names) {
    const card = cards[name];
    if (card && recallStage(card.fach) === 'produce') continue;
    const muscle = resolve(name);
    if (muscle && formenFuer(muscle).length > 0) quizMuskel.set(name, muscle);
  }

  // Die Folge der Plätze: Runde 1 alle Karten, jede weitere Runde nur die Quiz-Karten.
  const folge: string[] = [...names];
  for (let runde = 1; runde < FRAGEN_JE_KARTE; runde++) folge.push(...quizMuskel.keys());

  const quizPlaetze = folge
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => quizMuskel.has(name));
  const formen = verteileFormen(
    quizPlaetze.map(({ name }) => quizMuskel.get(name)!),
    rng,
    quizPlaetze.map(({ name }) => name),
  );
  const formAm = new Map(quizPlaetze.map(({ index }, i) => [index, formen[i]]));

  return folge.map((name, index) => {
    const form = formAm.get(index);
    const muscle = quizMuskel.get(name);
    return {
      name,
      frage:
        form && muscle
          ? questionForMuscle(muscle, form, distractors, rng, `mix${index}-${muscle.id}`)
          : null,
    };
  });
}
