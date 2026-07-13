import { useEffect, useRef } from 'react';
import { EXAM_FORM_LABELS } from '../../../data/exam';
import { regionLabel } from '../../../data/labels';
import { facts } from '../flashcards/facts';
import type { Muscle } from '../../../types';

interface ExamRecallFieldProps {
  muscle: Muscle;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Freier Abruf in der Prüfung (9c).
 *
 * Der Unterschied zur `TypeCard` aus 8a ist der ganze Punkt: Dort prüft „Enter" sofort
 * und sagt, ob es stimmt. **Hier passiert nichts.** Wer zwischendurch weiß, dass er
 * falsch lag, prüft nicht mehr — er lernt. Ausgewertet wird erst am Ende, mit `checkAnswer`
 * und dem vollen Korpus.
 */
export function ExamRecallField({ muscle, value, onChange }: ExamRecallFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Die Karte IST eine Eingabeaufforderung — bei jeder neuen Frage den Fokus setzen.
  useEffect(() => {
    inputRef.current?.focus();
  }, [muscle.id]);

  return (
    <div className="exam-recall">
      <p className="exam-recall__category">{EXAM_FORM_LABELS.recall}</p>
      <span className="exam-recall__eyebrow">
        {regionLabel(muscle.region)} · {muscle.subregion}
      </span>
      <p className="exam-recall__question">Welcher Muskel ist das?</p>

      <dl className="flashcard__facts">
        {facts(muscle).map(({ label, value: fact }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{fact}</dd>
          </div>
        ))}
      </dl>

      <label className="fc-field__label" htmlFor="exam-recall-answer">
        Lateinischer Name
      </label>
      <input
        ref={inputRef}
        id="exam-recall-answer"
        className="exam-recall__input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="z. B. M. deltoideus"
      />
    </div>
  );
}
