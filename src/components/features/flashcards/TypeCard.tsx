import { useEffect, useRef, useState, type FormEvent } from 'react';
import { checkAnswer, type AnswerCheck } from '../../../data/answer-check';
import { regionLabel } from '../../../data/labels';
import { getMuscles } from '../../../data';
import { Icon } from '../../ui/Icon';
import { facts } from './facts';
import type { CardRating, Muscle } from '../../../types';

/* Der ganze Namensraum ist die Messlatte: Eine Antwort, die genauso gut auf einen
   anderen Muskel passt, darf nicht durchgehen (siehe data/answer-check.ts). */
const CORPUS = getMuscles().map((m) => ({ nameLatin: m.nameLatin, nameDE: m.nameDE }));

interface TypeCardProps {
  muscle: Muscle;
  onRate: (rating: CardRating) => void;
}

/**
 * Fach 7 — Produktionsstufe (ADR 0008). Hier steht keine Auswahl mehr daneben:
 * Die Karte zeigt, was der Muskel tut, und der Name muss selbst kommen.
 *
 * Ein Tippfehler ist keine Wissenslücke — er zählt als richtig, wird aber sichtbar
 * korrigiert. Ein Bedeutungsfehler zählt als falsch und ist eine ganz normale
 * Leitner-Rückstufung, keine Extra-Strafe.
 */
export function TypeCard({ muscle, onRate }: TypeCardProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnswerCheck | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Die Karte IST eine Eingabeaufforderung — ohne Fokus müsste man erst hinklicken.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Nach dem Prüfen liegt der Fokus auf „Weiter" — Enter prüft, Enter geht weiter.
  useEffect(() => {
    if (result) nextRef.current?.focus();
  }, [result]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (result) {
      onRate(result.verdict === 'wrong' ? 'wrong' : 'correct');
      return;
    }
    if (input.trim() === '') return;
    setResult(checkAnswer(input, muscle, CORPUS));
  };

  return (
    <form className="type-card" onSubmit={submit}>
      <div className="type-card__prompt">
        <span className="flashcard__eyebrow">
          {regionLabel(muscle.region)} · {muscle.subregion}
        </span>
        <p className="type-card__question">Welcher Muskel ist das?</p>
        <dl className="flashcard__facts">
          {facts(muscle).map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <label className="fc-field__label" htmlFor="type-card-answer">
        Lateinischer Name
      </label>
      <input
        ref={inputRef}
        id="type-card-answer"
        className="type-card__input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        readOnly={result !== null}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="z. B. M. deltoideus"
      />

      {result && (
        <p className={`type-card__result type-card__result--${result.verdict}`} role="status">
          <Icon name={result.verdict === 'wrong' ? 'icClose' : 'icCheck'} size={18} />
          <span>
            {result.verdict === 'correct' && 'Richtig.'}
            {result.verdict === 'almost' && `Fast — richtig geschrieben: ${result.matched}`}
            {result.verdict === 'wrong' && `Nicht richtig. Gesucht war ${muscle.nameLatin}.`}
          </span>
        </p>
      )}

      <div className="type-card__actions">
        <button
          ref={nextRef}
          type="submit"
          className="btn btn--primary"
          disabled={!result && input.trim() === ''}
        >
          {result ? 'Weiter' : 'Prüfen'}
        </button>
        {!result && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setResult({ verdict: 'wrong', matched: null })}
          >
            Weiß ich nicht
          </button>
        )}
      </div>

      <p className="fc-controls-hint">
        Fach 7 — freier Abruf, ohne Auswahl. <kbd>Enter</kbd> prüfen
      </p>
    </form>
  );
}
