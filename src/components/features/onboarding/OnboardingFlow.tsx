/* =========================================================================
   Onboarding — zwei Fragen, kein Konto, keine Tutorial-Slides (Etappe 7c).
   src/components/features/onboarding/OnboardingFlow.tsx

   **Etappe 10 / ADR 0009:** Das Onboarding legt **keine Karten** mehr an und startet
   **keine Sitzung**. Es fragt nur noch, wer da lernt — danach führt `/heute` den Schüler
   durch den Guide und er wählt seine Karten selbst.

   Warum der Beruf trotzdem bleibt, obwohl er kein Startdeck mehr erzeugt:
   Er wird im Backup persistiert (ADR 0002, Sektion `profile`) und er trägt das Curriculum
   — Kurs 1 der Logopädie ist nicht Kurs 1 der Physiotherapie.
   ========================================================================= */

import { useState } from 'react';
import { PROFESSION_LABELS, PROFESSIONS, type Profession } from '../../../data/profession';
import { Icon } from '../../ui/Icon';
import './onboarding.css';

export interface OnboardingResult {
  profession: Profession;
  /** „YYYY-MM-DD" oder null (übersprungen). */
  examDate: string | null;
}

interface OnboardingFlowProps {
  onDone: (result: OnboardingResult) => void;
}

/**
 * Was der Beruf BEWIRKT — nicht, was er angeblich umfasst.
 *
 * Hier stand bis zum 2026-07-27 „Extremitäten, Rumpf, Palpation am Menschen" (Physio) und
 * „Hand, Arm, Feinmotorik" (Ergo). Vom Projektinhaber (Lehrkraft) beanstandet, und er hat
 * recht: Das liest sich wie eine **Stoffgrenze**, und die ist fachlich falsch — ein Ergo
 * braucht die obere Extremität vollständig, nicht nur „Hand und Feinmotorik". Die App
 * schränkt auch gar nichts ein: `orderedJointGroups` **sortiert nur**, jede der elf Gruppen
 * bleibt für jeden Beruf wählbar (Prüfzeile in `joint-groups.test.ts`).
 *
 * Die Texte nennen darum genau das, was der Beruf wirklich tut: welche Gruppen oben stehen.
 * Sie folgen `TYPICAL` in `data/joint-groups.ts` — **wer dort etwas ändert, ändert es hier
 * mit.**
 */
const PROFESSION_PURPOSE: Record<Profession, string> = {
  physio: 'Wirbelsäule, Hüfte, Knie und Fuß zuerst',
  ergo: 'Hand, Ellenbogen und Schulter zuerst',
  logo: 'Kau-, Zungenbein- und Kehlkopfmuskulatur',
};

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const [profession, setProfession] = useState<Profession | null>(null);
  const [examDate, setExamDate] = useState('');

  if (profession === null) {
    return (
      <div className="onboarding">
        <h1 className="page__title onboarding__question">Was lernst du?</h1>
        <p className="onboarding__hint">
          Damit die App weiß, welche Kursabschnitte zu dir gehören und was sie dir zuerst
          vorschlägt. Sie sortiert nur — jede Gelenkgruppe bleibt für jeden wählbar. Deinen
          Karteikasten stellst du selbst zusammen; die App legt dir nichts ungefragt hinein.
        </p>

        <div className="onboarding__choices">
          {PROFESSIONS.map((p) => (
            <button
              key={p}
              type="button"
              className="onboarding__choice"
              onClick={() => setProfession(p)}
            >
              <span className="onboarding__choice-label">{PROFESSION_LABELS[p]}</span>
              <span className="onboarding__choice-meta">{PROFESSION_PURPOSE[p]}</span>
              <Icon name="icArrow" size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const finish = (date: string | null) => onDone({ profession, examDate: date });

  return (
    <div className="onboarding">
      <button type="button" className="onboarding__back" onClick={() => setProfession(null)}>
        <Icon name="icArrowL" size={16} />
        <span>{PROFESSION_LABELS[profession]}</span>
      </button>

      <h1 className="page__title onboarding__question">Wann ist deine Prüfung?</h1>
      <p className="onboarding__hint">
        Mit Datum verteilen wir die Wiederholungen enger, je näher der Termin rückt. Ohne Datum
        lernst du im ruhigen Takt — beides ist in Ordnung.
      </p>

      <label className="onboarding__field">
        <span className="onboarding__field-label">Prüfungstermin (optional)</span>
        <input
          type="date"
          className="onboarding__date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => finish(examDate || null)}
      >
        Weiter
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={() => finish(null)}>
        Ohne Datum weiter
      </button>

      <p className="onboarding__hint onboarding__hint--quiet">
        Alles bleibt auf diesem Gerät — kein Konto, keine Übertragung.
      </p>
    </div>
  );
}
