import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QuestionCard } from '../components/features/quiz/QuestionCard';
import { QuizProgress } from '../components/features/quiz/QuizProgress';
import { QuizResult } from '../components/features/quiz/QuizResult';
import { Icon } from '../components/ui/Icon';
import { getRegions, getMuscles } from '../data';
import { regionLabel } from '../data/labels';
import {
  readQuizHandoff,
  QUIZ_SCOPES,
  QUIZ_SCOPE_LABELS,
  type QuizScope,
} from '../data/quiz';
import { quizPoolSize } from '../data/quiz-pool';
import { useQuizGame } from '../hooks/useQuizGame';
import { useProgressStore } from '../store/useProgressStore';
import type { QuizMode, RegionId } from '../types';
import '../components/features/quiz/quiz.css';
import '../components/features/exam/exam.css';

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
  {
    // Geprüft wird in Zusammenhängen, nicht Muskel für Muskel (9a).
    title: 'Funktionelle Gruppen',
    desc: 'Welcher Muskel gehört nicht dazu? — Rotatorenmanschette, Ischiocrurale, Kaumuskulatur … Fragt immer über den ganzen Bestand.',
    directions: [{ mode: 'group-odd-one-out', label: 'Starten' }],
  },
];

function QuizGame({
  mode,
  regions,
  scope,
  onExit,
  onRestart,
}: {
  mode: QuizMode;
  regions: RegionId[];
  scope: QuizScope;
  onExit: () => void;
  onRestart: () => void;
}) {
  const game = useQuizGame(mode, 10, regions, scope);

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

const MUSCLES = getMuscles();

export function QuizPage() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [round, setRound] = useState(0);
  const [regions, setRegions] = useState<RegionId[]>([]);
  const [scope, setScope] = useState<QuizScope>('all');
  const cards = useProgressStore((s) => s.flashcards.cards);

  /* Übergabe aus der Statistik (8c): „Diesen Modus üben" startet ihn direkt, ohne
     Umweg über die Modus-Wahl. Pro Navigation genau einmal — sonst würde ein Abbruch
     sofort wieder in denselben Modus zurückspringen (dasselbe Muster wie 7b). */
  const location = useLocation();
  const consumedKey = useRef<string | null>(null);
  useEffect(() => {
    if (consumedKey.current === location.key) return;
    const handoff = readQuizHandoff(location.state);
    if (!handoff) return;
    consumedKey.current = location.key;
    setMode(handoff);
  }, [location.key, location.state]);

  const regionKey = useMemo(() => [...regions].sort().join(','), [regions]);

  /* Wie viele Fragen jeder Umfang hergibt — die Zahl steht am Knopf, und ein Umfang ohne
     Karten ist deaktiviert statt eine leere Runde zu starten (Regel aus 8c). */
  const poolSizes = useMemo(() => {
    const sizes = {} as Record<QuizScope, number>;
    for (const s of QUIZ_SCOPES) {
      sizes[s] = quizPoolSize({ muscles: MUSCLES, cards, regions, scope: s });
    }
    return sizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, regionKey]);

  function toggleRegion(id: RegionId) {
    setRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  /* Ein Bereichswechsel kann den gewaehlten Umfang leerlaufen lassen („schwierig" in der
     unteren Extremitaet: 0 Karten). Dann gilt wieder „Alle Muskeln" — abgeleitet, nicht
     im State nachgezogen: eine Zustandsaenderung waehrend des Renderns waere fragil. */
  const activeScope: QuizScope = poolSizes[scope] === 0 ? 'all' : scope;

  return (
    <section className="page quiz">
      <header className="quiz__header">
        <p className="page__eyebrow">Wissen prüfen</p>
        <h1 className="page__title">Quiz</h1>
      </header>

      {mode === null ? (
        <>
          {/* Die Prüfung ist kein Quizmodus, sondern eine Standortbestimmung: festes Set,
              kein Feedback zwischendurch, und danach wird aus jedem Fehler eine Karte (9c).
              Sie steht darum ÜBER den Modi und schreibt in keine Quizserie. */}
          <section className="quiz-exam-entry" aria-labelledby="quiz-exam-entry">
            <h2 className="quiz-exam-entry__title" id="quiz-exam-entry">
              <Icon name="icTarget" size={18} />
              Prüfungsmodus
            </h2>
            <p className="quiz-exam-entry__desc">
              20 Fragen aus deinem Kasten, gemischt über die Abrufformen, ohne Rückmeldung
              zwischendurch. Am Ende siehst du, wo die Lücken sind — und übst sie sofort.
            </p>
            <Link to="/pruefung" className="btn btn--primary">
              Prüfung starten
            </Link>
          </section>

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

          {/* Woher die FRAGEN kommen (8b, entschieden 2026-07-13). Die falschen Antworten
              kommen unabhaengig davon aus dem ganzen Bestand — darum genuegt hier schon
              EINE passende Karte fuer eine Frage. */}
          <div className="quiz-filter" role="group" aria-label="Fragen aus diesen Karten">
            <span className="quiz-filter__label">Fragen aus</span>
            <div className="quiz-filter__chips">
              {QUIZ_SCOPES.map((s) => {
                const size = poolSizes[s];
                const leer = size === 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`chip${activeScope === s ? ' chip--active' : ''}`}
                    aria-pressed={activeScope === s}
                    disabled={leer}
                    onClick={() => setScope(s)}
                  >
                    {QUIZ_SCOPE_LABELS[s]}
                    <span className="quiz-filter__count">
                      {leer ? 'keine Karten' : size}
                    </span>
                  </button>
                );
              })}
            </div>
            {activeScope !== 'all' && (
              <p className="quiz-filter__note">
                Die falschen Antwortmöglichkeiten kommen aus dem ganzen Bestand — deshalb
                reicht schon eine Karte für eine Frage.
              </p>
            )}
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
          key={`${mode}-${regionKey}-${activeScope}-${round}`}
          mode={mode}
          regions={regions}
          scope={activeScope}
          onExit={() => setMode(null)}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </section>
  );
}
