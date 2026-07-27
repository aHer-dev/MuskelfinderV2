import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QuestionCard } from '../components/features/quiz/QuestionCard';
import { QuizProgress } from '../components/features/quiz/QuizProgress';
import { QuizResult } from '../components/features/quiz/QuizResult';
import { QuizTimer } from '../components/features/quiz/QuizTimer';
import { Icon } from '../components/ui/Icon';
import { getRegions, getMuscles } from '../data';
import { regionLabel } from '../data/labels';
import { QUIZ_MODE_LABELS } from '../data/mode-labels';
import {
  readQuizHandoff,
  QUIZ_SCOPES,
  QUIZ_SCOPE_LABELS,
  QUIZ_TIME_LIMITS,
  QUIZ_TIME_LIMIT_LABELS,
  type QuizScope,
  type QuizTimeLimit,
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

/**
 * Quiz-Typen wie in V1 (`quiz.html`): je Karte Richtungs-Buttons inkl. „Gemischt".
 *
 * Die konkreten Richtungen tragen die Namen aus `data/mode-labels.ts` — sie muessen
 * mit Statistik und Prüfung übereinstimmen, sonst sieht dieselbe Übung nach zwei
 * verschiedenen aus. **„Gemischt" und „Starten" bleiben absichtlich hier:** Das sind
 * keine Modusnamen, sondern Knopfbeschriftungen im Zusammenhang ihrer Karte. Unter
 * „Ursprung & Ansatz" ist „Gemischt" verständlich; „Ursprung ↔ Ansatz" wäre dort nur
 * umständlich. Ein gemeinsamer Name wäre hier der Fehler.
 */
const FAMILIES: QuizFamily[] = [
  {
    title: 'Bildzuordnung',
    desc: 'Erkenne den Muskel am Bild — oder das Bild zum Namen.',
    directions: [
      { mode: 'image', label: QUIZ_MODE_LABELS.image },
      { mode: 'name-image', label: QUIZ_MODE_LABELS['name-image'] },
      { mode: 'image-mixed', label: 'Gemischt' },
    ],
  },
  {
    title: 'Ursprung & Ansatz',
    desc: 'Ordne Ansätze und Ursprünge einander zu.',
    directions: [
      { mode: 'origin-insertion', label: QUIZ_MODE_LABELS['origin-insertion'] },
      { mode: 'insertion-origin', label: QUIZ_MODE_LABELS['insertion-origin'] },
      { mode: 'origin-insertion-mixed', label: 'Gemischt' },
    ],
  },
  {
    title: 'Funktions-Quiz',
    desc: 'Ordne Muskeln ihren Funktionen zu — oder umgekehrt.',
    directions: [
      { mode: 'function-to-muscle', label: QUIZ_MODE_LABELS['function-to-muscle'] },
      { mode: 'muscle-to-function', label: QUIZ_MODE_LABELS['muscle-to-function'] },
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
  timeLimit,
  onExit,
  onRestart,
}: {
  mode: QuizMode;
  regions: RegionId[];
  scope: QuizScope;
  timeLimit: QuizTimeLimit;
  onExit: () => void;
  onRestart: () => void;
}) {
  const game = useQuizGame(mode, 10, regions, scope, timeLimit);

  /* Tastatur wie in der Lernsitzung (UX-Review 2026-07-26). Dort gibt es seit 8a
     `Space`/`1`/`2`/`3`; im Quiz musste man bis dahin für JEDE Frage zur Maus greifen oder
     sich zum „Weiter"-Knopf durchtabben — unter der 15-Sekunden-Uhr ist das der Unterschied
     zwischen Denken und Hetzen. `1`–`4` wählt, Enter geht weiter.

     Zwei Riegel: Eingabefelder behalten ihre Tasten (dieselbe Regel wie in 8a), und ein
     offenes Sheet (`ExplainSheet` liegt ÜBER der Frage) schluckt sie — sonst blättert Enter
     die Frage weg, während man die Erklärung liest. */
  const { phase, question, answer: antworte, next: weiter } = game;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ziel = e.target;
      if (
        ziel instanceof HTMLInputElement ||
        ziel instanceof HTMLTextAreaElement ||
        ziel instanceof HTMLSelectElement ||
        (ziel instanceof HTMLElement && ziel.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector('.sheet [role="dialog"], .sheet__panel')) return;

      if (phase === 'answering' && question) {
        const nummer = Number(e.key);
        if (Number.isInteger(nummer) && nummer >= 1 && nummer <= question.options.length) {
          e.preventDefault();
          antworte(question.options[nummer - 1].id);
        }
        return;
      }
      if (phase === 'revealed' && e.key === 'Enter') {
        e.preventDefault();
        weiter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, question, antworte, weiter]);

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

      {game.timeLimit > 0 && (
        <QuizTimer
          limit={game.timeLimit}
          remaining={game.remaining}
          paused={game.phase !== 'answering'}
        />
      )}

      {game.question && (
        <QuestionCard
          question={game.question}
          phase={game.phase}
          selectedId={game.selectedId}
          timedOut={game.timedOut}
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

      {/* Kürzel nur nennen, wenn sie gerade etwas tun — dieselbe Regel wie auf der Lernkarte. */}
      <p className="quiz-game__keys">
        {game.phase === 'answering' ? (
          <>
            <kbd>1</kbd>–<kbd>{game.question?.options.length ?? 4}</kbd> antworten
          </>
        ) : (
          <>
            <kbd>Enter</kbd> {game.index < game.total - 1 ? 'weiter' : 'auswerten'}
          </>
        )}
      </p>
    </div>
  );
}

const MUSCLES = getMuscles();

export function QuizPage() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [round, setRound] = useState(0);
  const [regions, setRegions] = useState<RegionId[]>([]);
  const [scope, setScope] = useState<QuizScope>('all');
  /* Vorgabe 0 = ohne Uhr. Das ist nicht nur freundlich, sondern die Bedingung, unter der
     ein Zeitlimit ueberhaupt zulaessig ist (WCAG 2.2.1): abschaltbar, und aus per Default. */
  const [timeLimit, setTimeLimit] = useState<QuizTimeLimit>(0);
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

          {/* Zeitdruck (Etappe 11). Aus per Default — wer ihn will, schaltet ihn ein. */}
          <div className="quiz-filter" role="group" aria-label="Zeit pro Frage">
            <span className="quiz-filter__label">Zeit pro Frage</span>
            <div className="quiz-filter__chips">
              {QUIZ_TIME_LIMITS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip${timeLimit === s ? ' chip--active' : ''}`}
                  aria-pressed={timeLimit === s}
                  onClick={() => setTimeLimit(s)}
                >
                  {QUIZ_TIME_LIMIT_LABELS[s]}
                </button>
              ))}
            </div>
            {timeLimit > 0 && (
              <p className="quiz-filter__note">
                Läuft die Zeit ab, zählt die Frage als falsch und die richtige Antwort wird
                gezeigt. Runden unter der Uhr werden getrennt gewertet — sonst stünde eine Quote
                unter Zeitdruck neben einer in Ruhe, als wäre sie dasselbe.
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
          key={`${mode}-${regionKey}-${activeScope}-${timeLimit}-${round}`}
          mode={mode}
          regions={regions}
          scope={activeScope}
          timeLimit={timeLimit}
          onExit={() => setMode(null)}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </section>
  );
}
