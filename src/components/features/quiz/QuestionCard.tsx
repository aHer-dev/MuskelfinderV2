import { useEffect, useMemo, useRef, useState } from 'react';
import { explainWrongAnswer } from '../../../data/explain';
import type { QuizPhase, QuizQuestion } from '../../../types';
import { Icon } from '../../ui/Icon';
import { ExplainSheet } from './ExplainSheet';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

function optionModifier(
  optionId: string,
  correctId: string,
  selectedId: string | null,
  revealed: boolean,
): string {
  if (!revealed) return '';
  if (optionId === correctId) return ' quiz-option--correct';
  if (optionId === selectedId) return ' quiz-option--wrong';
  return '';
}

interface QuestionCardProps {
  question: QuizQuestion;
  phase: QuizPhase;
  selectedId: string | null;
  onAnswer: (optionId: string) => void;
}

/** Eine MC-Frage mit vier Optionen; nach der Antwort werden richtig/falsch markiert. */
export function QuestionCard({ question, phase, selectedId, onAnswer }: QuestionCardProps) {
  const revealed = phase !== 'answering';
  const imageOptions = question.options.some((o) => o.imageUrl);
  const correctLabel =
    question.options.find((o) => o.id === question.correctId)?.label ?? '';
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Roving-Tabindex: nur EINE Option liegt im Tab-Fluss; Pfeiltasten wandern
  // zwischen den Optionen, Enter/Space (nativer Button) wählt aus. Bei jeder
  // neuen Frage zurück auf die erste Option.
  const [roving, setRoving] = useState(0);
  const [explaining, setExplaining] = useState(false);
  useEffect(() => {
    setRoving(0);
    setExplaining(false);
  }, [question]);

  // Der Erklärsatz wird in der Datenschicht komponiert — hier wird er nur gezeigt.
  const explanation = useMemo(
    () => (revealed ? explainWrongAnswer({ question, selectedId }) : null),
    [revealed, question, selectedId],
  );

  const handleKey = (event: React.KeyboardEvent, index: number) => {
    const count = question.options.length;
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next === null) return;
    event.preventDefault();
    setRoving(next);
    optionRefs.current[next]?.focus();
  };

  return (
    <div className="quiz-card">
      <p className="quiz-card__category">{question.category}</p>

      {question.imageUrl ? (
        <div className="quiz-card__media">
          <img
            src={assetUrl(question.imageUrl)}
            alt="Anatomie-Ansicht zum Erraten"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <p className="quiz-card__prompt">{question.prompt}</p>
      )}

      <div
        className={`quiz-options${imageOptions ? ' quiz-options--images' : ''}`}
        role="radiogroup"
        aria-label={question.category}
      >
        {question.options.map((option, index) => (
          <button
            key={option.id}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={option.id === selectedId}
            aria-disabled={revealed}
            aria-label={imageOptions ? option.label : undefined}
            tabIndex={index === roving ? 0 : -1}
            className={`quiz-option${imageOptions ? ' quiz-option--image' : ''}${optionModifier(option.id, question.correctId, selectedId, revealed)}`}
            disabled={revealed}
            onClick={() => onAnswer(option.id)}
            onKeyDown={(event) => handleKey(event, index)}
          >
            <span className="quiz-option__badge" aria-hidden="true">
              {LETTERS[index]}
            </span>
            {option.imageUrl ? (
              <img
                className="quiz-option__img"
                src={assetUrl(option.imageUrl)}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="quiz-option__label">{option.label}</span>
            )}
            {/* Rot/Grün allein reicht nicht — bei Rot-Grün-Schwäche wäre sonst nicht
                erkennbar, welche Option richtig war. */}
            {revealed && option.id === question.correctId && (
              <Icon name="icCheck" size={18} className="quiz-option__mark" />
            )}
            {revealed && option.id === selectedId && option.id !== question.correctId && (
              <Icon name="icClose" size={18} className="quiz-option__mark" />
            )}
          </button>
        ))}
      </div>

      <p className="quiz-card__feedback" role="status" aria-live="polite">
        {revealed
          ? selectedId === question.correctId
            ? 'Richtig!'
            : `Leider falsch. Richtig ist: ${correctLabel}`
          : ''}
      </p>

      {/* Nicht nur WAS richtig war, sondern WARUM — sonst erkennt man die Lösung beim
          nächsten Mal bloß wieder, ohne den Unterschied zu kennen. */}
      {explanation && (
        <div className="quiz-card__explain">
          <p className="quiz-card__explain-text">{explanation.text}</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setExplaining(true)}
          >
            <Icon name="icInfo" size={16} /> Beide vergleichen
          </button>
        </div>
      )}

      {explanation && (
        <ExplainSheet
          open={explaining}
          explanation={explanation}
          onClose={() => setExplaining(false)}
        />
      )}
    </div>
  );
}
