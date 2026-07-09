import { useEffect, useRef, useState } from 'react';
import type { QuizPhase, QuizQuestion } from '../../../types';

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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Roving-Tabindex: nur EINE Option liegt im Tab-Fluss; Pfeiltasten wandern
  // zwischen den Optionen, Enter/Space (nativer Button) wählt aus. Bei jeder
  // neuen Frage zurück auf die erste Option.
  const [roving, setRoving] = useState(0);
  useEffect(() => setRoving(0), [question]);

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

      <div className="quiz-options" role="radiogroup" aria-label={question.category}>
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
            tabIndex={index === roving ? 0 : -1}
            className={`quiz-option${optionModifier(option.id, question.correctId, selectedId, revealed)}`}
            disabled={revealed}
            onClick={() => onAnswer(option.id)}
            onKeyDown={(event) => handleKey(event, index)}
          >
            <span className="quiz-option__badge" aria-hidden="true">
              {LETTERS[index]}
            </span>
            <span className="quiz-option__label">{option.label}</span>
          </button>
        ))}
      </div>

      <p className="quiz-card__feedback" role="status" aria-live="polite">
        {revealed
          ? selectedId === question.correctId
            ? 'Richtig!'
            : 'Leider falsch — die richtige Antwort ist markiert.'
          : ''}
      </p>
    </div>
  );
}
