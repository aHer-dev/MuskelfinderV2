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

  return (
    <div className="quiz-card">
      <p className="quiz-card__category">{question.category}</p>

      {question.imageUrl ? (
        <div className="quiz-card__media">
          <img src={assetUrl(question.imageUrl)} alt="Anatomie-Ansicht zum Erraten" loading="lazy" />
        </div>
      ) : (
        <p className="quiz-card__prompt">{question.prompt}</p>
      )}

      <div className="quiz-options" role="radiogroup" aria-label={question.category}>
        {question.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === selectedId}
            aria-disabled={revealed}
            className={`quiz-option${optionModifier(option.id, question.correctId, selectedId, revealed)}`}
            disabled={revealed}
            onClick={() => onAnswer(option.id)}
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
