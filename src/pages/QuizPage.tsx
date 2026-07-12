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

interface QuizFamily {
  title: string;
  desc: string;
  directions: Array<{ mode: QuizMode; label: string }>;
}

/** Quiz-Typen wie in V1 (`quiz.html`): je Karte Richtungs-Buttons inkl. „Gemischt". */
const FAMILIES: QuizFamily[] = [
  {
    title: 'Bildzuordnung',
    desc: 'Erkenne den Muskel am Bild — oder das Bild zum Namen.',
    directions: [
      { mode: 'image', label: 'Bild → Muskel' },
      { mode: 'name-image', label: 'Name → Bild' },
      { mode: 'image-mixed', label: 'Gemischt' },
    ],
  },
  {
    title: 'Ursprung & Ansatz',
    desc: 'Ordne Ansätze und Ursprünge einander zu.',
    directions: [
      { mode: 'origin-insertion', label: 'Ursprung → Ansatz' },
      { mode: 'insertion-origin', label: 'Ansatz → Ursprung' },
      { mode: 'origin-insertion-mixed', label: 'Gemischt' },
    ],
  },
  {
    title: 'Funktions-Quiz',
    desc: 'Ordne Muskeln ihren Funktionen zu — oder umgekehrt.',
    directions: [
      { mode: 'function-to-muscle', label: 'Funktion → Muskel' },
      { mode: 'muscle-to-function', label: 'Muskel → Funktion' },
      { mode: 'function-mixed', label: 'Gemischt' },
    ],
  },
  {
    title: 'Innervation',
    desc: 'Welcher Nerv versorgt den Muskel?',
    directions: [{ mode: 'innervation', label: 'Starten' }],
  },
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
          {game.score} {game.score === 1 ? 'Punkt' : 'Punkte'} · {game.streak} in Folge richtig
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
            {FAMILIES.map((family) => (
              <li key={family.title} className="quiz-family">
                <h2 className="quiz-family__title">{family.title}</h2>
                <p className="quiz-family__desc">{family.desc}</p>
                <div className="quiz-family__dirs">
                  {family.directions.map((dir) => (
                    <button
                      key={dir.mode}
                      type="button"
                      className="quiz-dir-btn"
                      onClick={() => setMode(dir.mode)}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
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
