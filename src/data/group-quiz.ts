/* =========================================================================
   Gruppen-Quiz (Etappe 9a) — „Welcher gehört NICHT dazu?"
   src/data/group-quiz.ts

   Der Modus, der prüft, wie geprüft wird: nicht „was macht dieser Muskel", sondern
   „welche gehören zusammen". Genau die Frage, die in der Prüfung gestellt wird.

   Der Distraktor kommt bewusst aus **derselben Region** — sonst wäre die Frage
   trivial („welcher Kaumuskel gehört nicht zur Rotatorenmanschette?").
   ========================================================================= */

import { createRng, shuffle } from './quiz';
import type { MuscleGroup } from './groups';
import type { Muscle, QuizQuestion } from '../types';

/** Optionen je Frage — wie im übrigen Quiz. */
const OPTION_COUNT = 4;
/** Aus einer Gruppe mit weniger Mitgliedern lässt sich keine 4er-Frage bauen. */
const MIN_GROUP_SIZE = OPTION_COUNT - 1;

export interface GroupQuizInput {
  groups: readonly MuscleGroup[];
  muscles: readonly Muscle[];
  count: number;
  rng?: () => number;
}

/**
 * Fragen der Form „Welcher Muskel gehört NICHT zur Rotatorenmanschette?".
 * Richtige Antwort ist der **Fremde** — das ist die Frage, nicht ein Trick.
 *
 * Eine Gruppe, für die sich kein Distraktor aus derselben Region finden lässt, wird
 * ausgelassen (statt einen fachlich sinnlosen zu erfinden).
 */
export function generateGroupQuiz({
  groups,
  muscles,
  count,
  rng = createRng(Date.now()),
}: GroupQuizInput): QuizQuestion[] {
  const byName = new Map(muscles.map((m) => [m.nameLatin, m]));
  const usable = groups.filter((g) => g.muscles.length >= MIN_GROUP_SIZE);

  const questions: QuizQuestion[] = [];

  for (const group of shuffle(usable, rng).slice(0, count)) {
    const members = group.muscles
      .map((name) => byName.get(name))
      .filter((m): m is Muscle => m !== undefined);
    if (members.length < MIN_GROUP_SIZE) continue;

    const inGroup = new Set(group.muscles);

    /* Erst die Mitglieder waehlen, DANN den Fremden — und zwar aus der Region der
       Mitglieder, die auch wirklich dastehen. Andersherum (Region aus ALLEN Mitgliedern)
       konnte der Fremde aus einer Region stammen, die auf dem Schirm gar nicht vorkommt:
       Dann ist er der einzige Fusspunkt unter drei Schulterpunkten — die Frage ist
       geschenkt, ohne dass man die Gruppe kennen muesste. */
    const gewaehlt = shuffle(members, rng).slice(0, OPTION_COUNT - 1);
    const regionen = new Set(gewaehlt.map((m) => m.region));

    /* Ein „in Klammern"-Muskel (`related`) steht bewusst NICHT in `inGroup` und darf
       darum Distraktor sein — er ist sogar der beste: „Welcher gehoert NICHT zur
       Bauchwand?" → M. quadratus lumborum ist genau die Pruefungsfrage. */
    const fremde = muscles.filter((m) => !inGroup.has(m.nameLatin) && regionen.has(m.region));
    if (fremde.length === 0) continue;

    const distraktor = shuffle(fremde, rng)[0];

    const options = shuffle([...gewaehlt, distraktor], rng).map((m) => ({
      id: m.id,
      label: m.nameLatin,
      muscleId: m.id,
    }));

    questions.push({
      id: `group-${group.id}`,
      prompt: `Welcher Muskel gehört NICHT zur Gruppe „${group.label}"?`,
      options,
      correctId: distraktor.id,
      muscleId: distraktor.id,
      mode: 'group-odd-one-out',
      concreteMode: 'group-odd-one-out',
      category: 'Funktionelle Gruppe',
    });
  }

  return questions;
}
