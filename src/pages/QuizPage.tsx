import { useState } from 'react';
import { QuestionCard } from '../components/features/quiz/QuestionCard';
import { QuizResult } from '../components/features/quiz/QuizResult';
import { useQuizGame } from '../hooks/useQuizGame';
import type { QuizMode } from '../types';
import '../components/features/quiz/quiz.css';

const MODES: Array<{ mode: QuizMode; label: string; desc: string }> = [
  { mode: 'function-to-muscle', label: 'Funktion → Muskel', desc: 'Welcher Muskel leistet das?' },
  { mode: 'muscle-to-function', label: 'Muskel → Funktion', desc: 'Was macht dieser Muskel?' },
  { mode: 'innervation', label: 'Innervation', desc: 'Welcher Nerv versorgt ihn?' },
  { mode: 'image', label: 'Bild → Muskel', desc: 'Erkenne den Muskel am Bild.' },
];

function QuizGame({
  mode,
  onExit,
  onRestart,
}: {
  mode: QuizMode;
  onExit: () => void;
  onRestart: () => void;
}) {
  const game = useQuizGame(mode);

  if (game.total === 0) {
    return (
      <div className="quiz-empty">
        <p>Für diesen Modus liegen zu wenige Daten vor.</p>
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          Modus wechseln
        </button>
      </div>
    );
  }

  if (game.result) {
    return <QuizResult result={game.result} onRestart={onRestart} onExit={onExit} />;
  }

  return (
    <div className="quiz-game">
      <div className="quiz-game__bar">
        <span className="quiz-game__progress">
          Frage {game.index + 1}/{game.total}
        </span>
        <span className="quiz-game__meta">
          Serie {game.streak} · {game.score} Pkt.
        </span>
      </div>

      {game.question && (
        <QuestionCard
          question={game.question}
          phase={game.phase}
          selectedId={game.selectedId}
          onAnswer={game.answer}
        />
      )}

      <div className="quiz-game__foot">
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          Abbrechen
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={game.phase !== 'revealed'}
          onClick={game.next}
        >
          {game.index < game.total - 1 ? 'Weiter' : 'Auswerten'}
        </button>
      </div>
    </div>
  );
}

export function QuizPage() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [round, setRound] = useState(0);

  return (
    <section className="page quiz">
      <header className="quiz__header">
        <p className="page__eyebrow">Wissen prüfen</p>
        <h1 className="page__title">Quiz</h1>
      </header>

      {mode === null ? (
        <ul className="quiz-modes">
          {MODES.map((item) => (
            <li key={item.mode}>
              <button type="button" className="quiz-mode" onClick={() => setMode(item.mode)}>
                <span className="quiz-mode__label">{item.label}</span>
                <span className="quiz-mode__desc">{item.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <QuizGame
          key={`${mode}-${round}`}
          mode={mode}
          onExit={() => setMode(null)}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </section>
  );
}
