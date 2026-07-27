/* =========================================================================
   Ein Modusname, ueberall derselbe.
   src/data/mode-labels.test.ts

   Der Fehler, der hier aussterben soll: Dieselbe Label-Tabelle stand an vier
   Stellen, zwei davon Zeichen fuer Zeichen identisch. Solange sie uebereinstimmen,
   faellt das nie auf — deshalb prueft dieser Test nicht die Tabelle, sondern die
   UEBEREINSTIMMUNG der Verbraucher mit ihr.
   ========================================================================= */

import { describe, expect, it } from 'vitest';
import { QUIZ_MODE_LABELS, istQuizModus, modusLabel } from './mode-labels';
import { EXAM_FORM_LABELS } from './exam';
import type { QuizMode } from '../types';

/* Alle Modi, die der Typ kennt — ausgeschrieben, damit ein neuer Modus hier
   auffaellt und nicht stillschweigend mitlaeuft. */
const ALLE_MODI: QuizMode[] = [
  'function-to-muscle', 'muscle-to-function', 'function-mixed', 'innervation',
  'origin-insertion', 'insertion-origin', 'origin-insertion-mixed',
  'image', 'name-image', 'image-mixed', 'group-odd-one-out',
];

describe('mode-labels', () => {
  it('kennt jeden Quiz-Modus', () => {
    for (const m of ALLE_MODI) {
      expect(QUIZ_MODE_LABELS[m], m).toBeTruthy();
    }
    expect(Object.keys(QUIZ_MODE_LABELS).sort()).toEqual([...ALLE_MODI].sort());
  });

  it('vergibt keinen Namen zweimal — sonst sehen zwei Modi gleich aus', () => {
    const namen = Object.values(QUIZ_MODE_LABELS);
    expect(new Set(namen).size).toBe(namen.length);
  });

  it('zeigt nie einen rohen Schlüssel für einen bekannten Modus', () => {
    for (const m of ALLE_MODI) {
      expect(modusLabel(m), m).not.toBe(m);
    }
  });

  it('fällt bei unbekannten Modi auf den Schlüssel zurück (V1-Backups)', () => {
    /* Kein Notnagel: Die Statistik liest Modi aus gespeicherten Serien. Ein Modus,
       den es nicht mehr gibt, darf die Statistik nicht leeren. */
    expect(modusLabel('gibt-es-nicht-mehr')).toBe('gibt-es-nicht-mehr');
    expect(istQuizModus('gibt-es-nicht-mehr')).toBe(false);
    expect(istQuizModus('image')).toBe(true);
    expect(istQuizModus(42)).toBe(false);
  });
});

describe('die Verbraucher stimmen mit der Tabelle überein', () => {
  it('Prüfung: jede MC-Form heißt wie im Quiz', () => {
    for (const [form, label] of Object.entries(EXAM_FORM_LABELS)) {
      if (form === 'recall') continue; // eigenes Prüfungs-Vokabular, kein Quiz-Modus
      expect(istQuizModus(form), `${form} ist kein Quiz-Modus`).toBe(true);
      expect(label, form).toBe(QUIZ_MODE_LABELS[form as QuizMode]);
    }
  });

  it('Prüfung: „Freier Abruf" gibt es NUR dort', () => {
    expect(EXAM_FORM_LABELS.recall).toBe('Freier Abruf');
    expect(Object.values(QUIZ_MODE_LABELS)).not.toContain('Freier Abruf');
  });
});
