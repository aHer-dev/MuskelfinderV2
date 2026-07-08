import type { QuizResult as QuizResultData } from '../../../types';

/** Abschluss-Ansicht einer Quiz-Serie. */
export function QuizResult({
  result,
  onRestart,
  onExit,
}: {
  result: QuizResultData;
  onRestart: () => void;
  onExit: () => void;
}) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="quiz-result">
      <h2 className="quiz-result__headline">{pct}% richtig</h2>
      <dl className="quiz-result__stats">
        <div>
          <dt>Richtig</dt>
          <dd>
            {result.correct}/{result.total}
          </dd>
        </div>
        <div>
          <dt>Beste Serie</dt>
          <dd>{result.bestStreak}</dd>
        </div>
        <div>
          <dt>Punkte</dt>
          <dd>{result.score}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>+{result.xpEarned}</dd>
        </div>
      </dl>
      <div className="quiz-result__actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          Nochmal
        </button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          Modus wechseln
        </button>
      </div>
    </div>
  );
}
