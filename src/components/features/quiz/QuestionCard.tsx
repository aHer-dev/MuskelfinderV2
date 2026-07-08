import type { QuizPhase, QuizQuestion } from '../../../types';

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

      <div className="quiz-options" role="group" aria-label={question.category}>
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`quiz-option${optionModifier(option.id, question.correctId, selectedId, revealed)}`}
            aria-pressed={option.id === selectedId}
            disabled={revealed}
            onClick={() => onAnswer(option.id)}
          >
            {option.label}
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
