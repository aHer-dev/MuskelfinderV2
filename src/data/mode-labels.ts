/* =========================================================================
   Anzeigenamen der Quiz- und Pruefungs-Modi — an EINER Stelle.
   src/data/mode-labels.ts

   WARUM ES DAS GIBT: Dieselbe Label-Tabelle stand an vier Stellen, zwei davon
   Zeichen fuer Zeichen identisch:

     src/data/quiz.ts    `MODE_CATEGORY`      11 Eintraege
     src/data/stats.ts   `QUIZ_MODE_LABELS`   11 Eintraege — dieselben
     src/data/exam.ts    `EXAM_FORM_LABELS`    6 gemeinsame + `recall`
     src/pages/QuizPage  `FAMILIES`            die konkreten Richtungen erneut

   Solange sie uebereinstimmen, faellt das nie auf. Genau das ist die Gefahr: Wer
   „Ursprung → Ansatz" umbenennt, findet zwei der vier Stellen, und dann heisst
   derselbe Modus im Quiz anders als in der Statistik — beim Lernenden sieht das
   nach zwei verschiedenen Uebungen aus, die er nicht zusammenbringt.

   Was NICHT hierher gehoert: „Gemischt" und „Starten" in `QuizPage`. Das sind
   keine Modusnamen, sondern Knopfbeschriftungen im Zusammenhang ihrer Karte —
   unter „Ursprung & Ansatz" ist „Gemischt" verstaendlich und „Ursprung ↔ Ansatz"
   nur umstaendlich. Ein gemeinsamer Name waere hier der Fehler, nicht die Loesung.
   ========================================================================= */

import type { QuizMode } from '../types';

/**
 * Anzeigename je Quiz-Modus. `Record<QuizMode, string>` ist Absicht: Kommt ein
 * Modus zum Typ hinzu, meldet TypeScript die fehlende Zeile hier — und nicht
 * erst der Nutzer, dem ein roher Schluessel wie `group-odd-one-out` angezeigt
 * wird.
 */
export const QUIZ_MODE_LABELS: Record<QuizMode, string> = {
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

/** Ist `value` ein bekannter Quiz-Modus? */
export function istQuizModus(value: unknown): value is QuizMode {
  return typeof value === 'string' && Object.hasOwn(QUIZ_MODE_LABELS, value);
}

/**
 * Anzeigename zu einem Modus-Schluessel beliebiger Herkunft.
 *
 * Der Fallback auf den Schluessel selbst ist wichtig und kein Notnagel: Die
 * Statistik liest Modi aus **gespeicherten Serien**, auch aus V1-Backups. Ein
 * Modus, den es nicht mehr gibt, darf die Statistik nicht leeren — lieber steht
 * dort der rohe Schluessel als gar keine Zeile.
 */
export function modusLabel(mode: string): string {
  return istQuizModus(mode) ? QUIZ_MODE_LABELS[mode] : mode;
}
