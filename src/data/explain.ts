/* =========================================================================
   Falschantworten erklären sich selbst (Etappe 7e, Brücke B2) — reine Logik.
   src/data/explain.ts

   Wer im Quiz nur die richtige Lösung *sieht*, erkennt sie beim nächsten Mal
   wieder, ohne sie zu verstehen („Illusion of Competence"). Der Unterschied muss
   benannt werden — und zwar genau in dem Merkmal, nach dem gefragt war.

   Der Massenfall braucht dafür KEINE Redaktionsarbeit: Die App kennt die Daten
   beider Muskeln, des richtigen und des gewählten. Der Satz wird komponiert.
   Für die klassischen Prüfungsfallen kann ein handgeschriebener Satz hinterlegt
   werden (`confusions.ts`) — er ersetzt dann das Template.
   ========================================================================= */

import { getMuscleById } from './loader';
import { confusionText } from './confusions';
import type { Muscle, QuizQuestion } from '../types';

/** Das Merkmal, nach dem gefragt war — die Sheet-Gegenüberstellung hebt es hervor. */
export type ExplainAspect = 'function' | 'origin' | 'insertion' | 'innervation' | 'location';

export interface Explanation {
  /** Der fertige Satz. Nie leer. */
  text: string;
  /** Der Muskel, der gesucht war. */
  correct: Muscle;
  /** Der gewählte Muskel — fehlt nur, wenn der Distraktor keinem Muskel zuzuordnen ist. */
  chosen?: Muscle;
  aspect: ExplainAspect;
  /** true → der Satz stammt aus der Hand-Liste, nicht aus dem Template. */
  curated: boolean;
}

/** Satzbaustein säubern: Leerraum weg, Schlusspunkt weg (wir setzen ihn selbst). */
function clause(value: string | undefined): string {
  return (value ?? '').trim().replace(/[.;]+$/, '');
}

/** Lage in Worten, für die Bild-Modi („Schultergürtel"). */
function place(muscle: Muscle): string {
  return clause(muscle.subregion);
}

/**
 * „Mm. lumbricales" sind mehrere — der Satz muss mitziehen, sonst steht dort
 * „Mm. lumbricales wird von … versorgt".
 */
function isPlural(muscle: Muscle): boolean {
  return /^Mm\./.test(muscle.nameLatin);
}

const ASPECT_BY_MODE: Record<string, ExplainAspect> = {
  'function-to-muscle': 'function',
  'muscle-to-function': 'function',
  innervation: 'innervation',
  'origin-insertion': 'insertion',
  'insertion-origin': 'origin',
  image: 'location',
  'name-image': 'location',
};

/**
 * Der Kontrastsatz je Modus. Fehlt ein Feld im Datensatz, fällt der zugehörige
 * Halbsatz weg — der Satz wird kürzer, nie leer und nie kaputt.
 */
function compose(question: QuizQuestion, correct: Muscle, chosen: Muscle | undefined): string {
  const aspect = ASPECT_BY_MODE[question.concreteMode] ?? 'function';

  // Ohne zuzuordnenden Distraktor bleibt die halbe Aussage: was gesucht war.
  if (!chosen || chosen.id === correct.id) {
    switch (aspect) {
      case 'innervation':
        return clause(correct.innervation)
          ? `${correct.nameLatin} ${isPlural(correct) ? 'werden' : 'wird'} von ${clause(correct.innervation)} versorgt.`
          : `Gesucht war ${correct.nameLatin}.`;
      case 'insertion':
        return clause(correct.insertion)
          ? `Der Ansatz von ${correct.nameLatin} ist ${clause(correct.insertion)}.`
          : `Gesucht war ${correct.nameLatin}.`;
      case 'origin':
        return clause(correct.origin)
          ? `Der Ursprung von ${correct.nameLatin} ist ${clause(correct.origin)}.`
          : `Gesucht war ${correct.nameLatin}.`;
      default:
        return clause(correct.functionDescription)
          ? `Gesucht war ${correct.nameLatin}: ${clause(correct.functionDescription)}.`
          : `Gesucht war ${correct.nameLatin}.`;
    }
  }

  switch (question.concreteMode) {
    case 'muscle-to-function': {
      // Gefragt war die Funktion — gewählt wurde die eines anderen Muskels.
      const own = clause(correct.functionDescription);
      const head = `Das ist die Funktion von ${chosen.nameLatin}.`;
      return own ? `${head} ${correct.nameLatin} dagegen: ${own}.` : head;
    }

    case 'innervation': {
      const chosenNerve = clause(chosen.innervation);
      const correctNerve = clause(correct.innervation);
      const head = chosenNerve ? `${chosenNerve} versorgt ${chosen.nameLatin}.` : '';
      const tail = correctNerve
        ? `${correct.nameLatin} ${isPlural(correct) ? 'werden' : 'wird'} von ${correctNerve} versorgt.`
        : `Gesucht war ${correct.nameLatin}.`;
      return head ? `${head} ${tail}` : tail;
    }

    case 'origin-insertion': {
      const chosenIns = clause(chosen.insertion);
      const correctIns = clause(correct.insertion);
      const head = chosenIns ? `${chosenIns} ist der Ansatz von ${chosen.nameLatin}.` : '';
      const tail = correctIns
        ? `Der Ansatz von ${correct.nameLatin} ist ${correctIns}.`
        : `Gesucht war ${correct.nameLatin}.`;
      return head ? `${head} ${tail}` : tail;
    }

    case 'insertion-origin': {
      const chosenOrigin = clause(chosen.origin);
      const correctOrigin = clause(correct.origin);
      const head = chosenOrigin ? `${chosenOrigin} ist der Ursprung von ${chosen.nameLatin}.` : '';
      const tail = correctOrigin
        ? `Der Ursprung von ${correct.nameLatin} ist ${correctOrigin}.`
        : `Gesucht war ${correct.nameLatin}.`;
      return head ? `${head} ${tail}` : tail;
    }

    case 'image':
    case 'name-image': {
      // Gefragt war die Identität am Bild — kontrastiert wird die Lage.
      const chosenPlace = place(chosen) ? ` (${place(chosen)})` : '';
      const correctPlace = place(correct) ? ` (${place(correct)})` : '';
      const head =
        question.concreteMode === 'image'
          ? `Gewählt: ${chosen.nameLatin}${chosenPlace}.`
          : `Das gewählte Bild zeigt ${chosen.nameLatin}${chosenPlace}.`;
      return `${head} Abgebildet ist ${correct.nameLatin}${correctPlace}.`;
    }

    case 'function-to-muscle':
    default: {
      // Gefragt war der Muskel zu einer Funktion — kontrastiert werden die Funktionen.
      const chosenFn = clause(chosen.functionDescription);
      const correctFn = clause(correct.functionDescription);
      const head = chosenFn ? `${chosen.nameLatin}: ${chosenFn}.` : `Gewählt: ${chosen.nameLatin}.`;
      const tail = correctFn
        ? `Gesucht war ${correct.nameLatin}: ${correctFn}.`
        : `Gesucht war ${correct.nameLatin}.`;
      return `${head} ${tail}`;
    }
  }
}

export interface ExplainInput {
  question: QuizQuestion;
  /** Die gewählte (falsche) Option. */
  selectedId: string | null;
  /** Muskel-Auflösung — überschreibbar für Tests. */
  resolve?: (id: string) => Muscle | undefined;
}

/**
 * Erklärt eine Falschantwort. Gibt `null` zurück, wenn nichts zu erklären ist
 * (richtig geantwortet, nicht geantwortet, oder der gefragte Muskel fehlt).
 */
export function explainWrongAnswer({
  question,
  selectedId,
  resolve = getMuscleById,
}: ExplainInput): Explanation | null {
  if (!selectedId || selectedId === question.correctId) return null;

  const correct = resolve(question.muscleId);
  if (!correct) return null;

  const selected = question.options.find((o) => o.id === selectedId);
  const chosen = selected?.muscleId ? resolve(selected.muscleId) : undefined;

  const curated = chosen ? confusionText(correct.nameLatin, chosen.nameLatin) : null;

  return {
    text: curated ?? compose(question, correct, chosen),
    correct,
    chosen,
    aspect: ASPECT_BY_MODE[question.concreteMode] ?? 'function',
    curated: curated !== null,
  };
}
