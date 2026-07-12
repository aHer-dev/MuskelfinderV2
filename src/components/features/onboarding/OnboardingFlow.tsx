/* =========================================================================
   Onboarding — zwei Fragen, kein Konto, keine Tutorial-Slides (Etappe 7c).
   src/components/features/onboarding/OnboardingFlow.tsx

   Ziel ist eine Zahl: die erste bewertete Karte unter 60 Sekunden. Darum wird
   die Berufsfrage mit dem Klick beantwortet (die Wahl IST die Handlung, kein
   „Weiter" dahinter), und die Prüfungsfrage ist überspringbar.
   ========================================================================= */

import { useState } from 'react';
import { getMuscleByLatinName, getMuscles } from '../../../data';
import { regionLabel } from '../../../data/labels';
import { PROFESSION_LABELS, PROFESSIONS, seedDeck, type Profession } from '../../../data/seeding';
import { Icon } from '../../ui/Icon';
import './onboarding.css';

export interface OnboardingResult {
  profession: Profession;
  /** „YYYY-MM-DD" oder null (übersprungen). */
  examDate: string | null;
  /** Das Startdeck (`nameLatin`) — schon in Lernreihenfolge. */
  deck: string[];
}

interface OnboardingFlowProps {
  onDone: (result: OnboardingResult) => void;
}

/** Woraus das Startdeck besteht — als Vertrauenssignal, nicht als Statistik. */
function deckPreview(deck: string[]): string {
  const counts = new Map<string, number>();
  for (const name of deck) {
    const region = getMuscleByLatinName(name)?.region;
    if (region) counts.set(regionLabel(region), (counts.get(regionLabel(region)) ?? 0) + 1);
  }
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return top ? `${deck.length} Karten, Schwerpunkt ${top[0]}` : `${deck.length} Karten`;
}

const ALL_MUSCLES = getMuscles();

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const [profession, setProfession] = useState<Profession | null>(null);
  const [examDate, setExamDate] = useState('');

  if (profession === null) {
    return (
      <div className="onboarding">
        <h1 className="page__title onboarding__question">Was lernst du?</h1>
        <p className="onboarding__hint">
          Danach legen wir dir ein Startdeck an — passend zu deinem Beruf. Änderbar bleibt es
          jederzeit.
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
              <span className="onboarding__choice-meta">
                {deckPreview(seedDeck(p, ALL_MUSCLES))}
              </span>
              <Icon name="icArrow" size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const deck = seedDeck(profession, ALL_MUSCLES);
  const finish = (date: string | null) => onDone({ profession, examDate: date, deck });

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
        Startdeck anlegen und loslegen
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={() => finish(null)}>
        Ohne Datum weiter
      </button>

      <p className="onboarding__hint onboarding__hint--quiet">
        Dein Startdeck: {deckPreview(deck)}. Alles bleibt auf diesem Gerät — kein Konto, keine
        Übertragung.
      </p>
    </div>
  );
}
