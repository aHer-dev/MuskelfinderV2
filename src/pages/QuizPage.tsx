import { useMemo, useState } from 'react';
import { QuestionCard } from '../components/features/quiz/QuestionCard';
import { QuizProgress } from '../components/features/quiz/QuizProgress';
import { QuizResult } from '../components/features/quiz/QuizResult';
import { getRegions } from '../data';
import { regionLabel } from '../data/labels';
import { useQuizGame } from '../hooks/useQuizGame';
import type { QuizMode, RegionId } from '../types';
import '../components/features/quiz/quiz.css';

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[];

const MODES: Array<{ mode: QuizMode; label: string; desc: string }> = [
  { mode: 'function-to-muscle', label: 'Funktion → Muskel', desc: 'Welcher Muskel leistet das?' },
  { mode: 'muscle-to-function', label: 'Muskel → Funktion', desc: 'Was macht dieser Muskel?' },
  { mode: 'origin-insertion', label: 'Ursprung → Ansatz', desc: 'Welcher Ansatz gehört zum Ursprung?' },
  { mode: 'insertion-origin', label: 'Ansatz → Ursprung', desc: 'Welcher Ursprung gehört zum Ansatz?' },
  { mode: 'innervation', label: 'Innervation', desc: 'Welcher Nerv versorgt ihn?' },
  { mode: 'image', label: 'Bild → Muskel', desc: 'Erkenne den Muskel am Bild.' },
];

function QuizGame({
  mode,
  regions,
  onExit,
  onRestart,
}: {
  mode: QuizMode;
  regions: RegionId[];
  onExit: () => void;
  onRestart: () => void;
}) {
  const game = useQuizGame(mode, 10, regions);

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

      <QuizProgress total={game.total} index={game.index} results={game.results} />

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
  const [regions, setRegions] = useState<RegionId[]>([]);

  const regionKey = useMemo(() => [...regions].sort().join(','), [regions]);

  function toggleRegion(id: RegionId) {
    setRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  return (
    <section className="page quiz">
      <header className="quiz__header">
        <p className="page__eyebrow">Wissen prüfen</p>
        <h1 className="page__title">Quiz</h1>
      </header>

      {mode === null ? (
        <>
          <div className="quiz-filter" role="group" aria-label="Quiz auf Bereiche einschränken">
            <span className="quiz-filter__label">Bereich</span>
            <div className="quiz-filter__chips">
              <button
                type="button"
                className={`chip${regions.length === 0 ? ' chip--active' : ''}`}
                aria-pressed={regions.length === 0}
                onClick={() => setRegions([])}
              >
                Alle
              </button>
              {REGION_ORDER.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`chip${regions.includes(r) ? ' chip--active' : ''}`}
                  aria-pressed={regions.includes(r)}
                  onClick={() => toggleRegion(r)}
                >
                  {regionLabel(r)}
                </button>
              ))}
            </div>
          </div>

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
        </>
      ) : (
        <QuizGame
          key={`${mode}-${regionKey}-${round}`}
          mode={mode}
          regions={regions}
          onExit={() => setMode(null)}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </section>
  );
}
