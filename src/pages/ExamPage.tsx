/* =========================================================================
   ExamPage — Prüfungsmodus + Debrief (Etappe 9c, Brücke B3).

   Festes Set, kein Feedback bis zum Ende, Timer. Der Wert liegt im Debrief:
   **aus jedem Fehler wird eine Karte, und die Sitzung startet sofort.**

   ⚠️ Diese Seite benutzt `useQuizGame` NICHT. Der Hook committet jede Runde in die
   V1-Quizserien; die Prüfung schreibt in keine Serie (ADR 0002).
   ========================================================================= */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuestionCard } from '../components/features/quiz/QuestionCard';
import { ExamDebrief } from '../components/features/exam/ExamDebrief';
import { ExamRecallField } from '../components/features/exam/ExamRecallField';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { getMuscleById, getMuscles } from '../data';
import {
  buildExam,
  examDuration,
  gradeExam,
  EXAM_SIZE,
  MIN_EXAM_CARDS,
  type ExamBlocker,
} from '../data/exam';
import { useExamStore } from '../store/useExamStore';
import { useProgressStore } from '../store/useProgressStore';
import '../components/features/quiz/quiz.css';
import '../components/features/exam/exam.css';

const MUSCLES = getMuscles();

/** mm:ss — der Timer ist eine Zahl, keine Farbe. */
function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function blockerText(blocker: ExamBlocker): string {
  return blocker === 'emptyDeck'
    ? 'Dein Karteikasten ist leer. Eine Prüfung kann nur abfragen, was du dir vorgenommen hast.'
    : `Für eine Prüfung brauchst du mindestens ${MIN_EXAM_CARDS} Karten im Kasten — sonst misst sie Zufall, nicht deinen Stand.`;
}

export function ExamPage() {
  const navigate = useNavigate();

  const cards = useProgressStore((s) => s.flashcards.cards);
  const registerExamMisses = useProgressStore((s) => s.registerExamMisses);

  const phase = useExamStore((s) => s.phase);
  const items = useExamStore((s) => s.items);
  const answers = useExamStore((s) => s.answers);
  const index = useExamStore((s) => s.index);
  const endsAt = useExamStore((s) => s.endsAt);
  const blocker = useExamStore((s) => s.blocker);
  const startExam = useExamStore((s) => s.start);
  const answer = useExamStore((s) => s.answer);
  const go = useExamStore((s) => s.go);
  const finish = useExamStore((s) => s.finish);
  const reset = useExamStore((s) => s.reset);

  const [remaining, setRemaining] = useState(0);

  /* Der Timer beendet die Prüfung, er bestraft nicht: Was beantwortet ist, wird
     ausgewertet. Er tickt nur, solange eine Prüfung läuft. */
  useEffect(() => {
    if (phase !== 'running' || endsAt === null) return;
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) finish();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, endsAt, finish]);

  /* Hier stand bis zum UX-Review 2026-07-26 ein `useEffect(() => () => reset(), [reset])`:
     „eine Prüfung ist eine Momentaufnahme, beim Verlassen der Seite ist sie vorbei".
     Diese Entscheidung ist ÄLTER als Etappe 7d — seit 7d sitzt das Suchfeld in der
     Kopfzeile JEDER Route. Gemessen: Prüfung läuft, „biceps" ins Suchfeld, Enter, zurück
     → Startknopf, 20 Antworten weg, keine Warnung, kein Wiederherstellen.

     Die Lernsitzung wurde in 7d aus genau diesem Grund in einen Store verschoben. Die
     Prüfung liegt längst in einem (`useExamStore`); nur dieses Aufräumen hat sie getötet.
     Sie übersteht jetzt die Navigation und wird ausdrücklich verworfen — nicht im
     Vorbeigehen. Den Browser-Neustart übersteht sie bewusst weiterhin nicht (der Store
     ist nicht persistiert), genau wie die Lernsitzung. */
  const verwerfen = useCallback(() => {
    if (confirm('Laufende Prüfung verwerfen? Die Antworten werden nicht ausgewertet.')) reset();
  }, [reset]);

  const begin = useCallback(() => {
    const set = buildExam({ muscles: MUSCLES, deck: Object.keys(cards), count: EXAM_SIZE });
    startExam(set, examDuration(set.items.length));
  }, [cards, startExam]);

  const report = useMemo(
    () => (phase === 'done' ? gradeExam({ items, answers, muscles: MUSCLES }) : null),
    [phase, items, answers],
  );

  /* Brücke B3 — der einzige Primärbutton des Debriefs:
     1. verpasste Muskeln in den Kasten (fehlende werden angelegt), eine Box zurück,
        sofort fällig — sonst filterte `buildQueue` sie aus der Sitzung heraus,
     2. und direkt in die Sitzung mit genau diesen Karten. */
  const learnMistakes = useCallback(() => {
    if (!report || report.missedNames.length === 0) return;
    const names = report.missedNames;
    registerExamMisses(names);
    reset();
    navigate('/lernkarten', { state: { start: { names, limit: 0, scope: 'all' } } });
  }, [report, registerExamMisses, reset, navigate]);

  const item = items[index] ?? null;
  const answeredCount = items.filter((i) => (answers[i.id] ?? '').trim() !== '').length;
  // Das Set wird aus vorhandenen Muskeln gebaut — die Auflösung kann nur fehlschlagen,
  // wenn sich die Daten unter der laufenden Prüfung ändern. Dann lieber nichts als ein Absturz.
  const recallMuscle = item?.kind === 'recall' ? getMuscleById(item.muscleId) : undefined;

  /* ── Auswertung ─────────────────────────────────────────────────────── */
  if (phase === 'done' && report) {
    return (
      <section className="page exam">
        <header className="exam__header">
          <p className="page__eyebrow">Prüfungsmodus</p>
          <h1 className="page__title">Prüfung</h1>
        </header>
        <ExamDebrief
          report={report}
          onLearnMistakes={learnMistakes}
          onRestart={begin}
          onClose={reset}
        />
      </section>
    );
  }

  /* ── Die laufende Prüfung ───────────────────────────────────────────── */
  if (phase === 'running' && item) {
    return (
      <section className="page exam">
        <header className="exam__header">
          <p className="page__eyebrow">Prüfungsmodus</p>
          <h1 className="page__title">Prüfung</h1>
        </header>

        <div className="exam__bar">
          <span className="exam__count">
            Frage {index + 1}/{items.length}
          </span>
          <p className="exam__timer">
            <Icon name="icTarget" size={16} />
            <span className="exam__timer-label">Restzeit</span>
            <strong>{clock(remaining)}</strong>
            {/* Nicht nur Farbe: Die letzte Minute steht als Wort da. */}
            {remaining <= 60 && <span className="exam__timer-warn">letzte Minute</span>}
          </p>
        </div>

        {/* Fortschritt zeigt NUR, was beantwortet ist — nicht, ob es stimmt. */}
        <ol className="exam-steps" aria-label={`${answeredCount} von ${items.length} Fragen beantwortet`}>
          {items.map((step, i) => {
            const done = (answers[step.id] ?? '').trim() !== '';
            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={`exam-step${done ? ' exam-step--answered' : ''}${i === index ? ' exam-step--current' : ''}`}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Frage ${i + 1}${done ? ', beantwortet' : ', offen'}`}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>

        {item.kind === 'recall' ? (
          recallMuscle && (
            <ExamRecallField
              key={item.id}
              muscle={recallMuscle}
              value={answers[item.id] ?? ''}
              onChange={(value) => answer(item.id, value)}
            />
          )
        ) : (
          /* `phase="answering"` ist hier die ganze Prüfungslogik: Die Karte färbt
             nichts ein, verrät nichts und lässt die Antwort änderbar. */
          <QuestionCard
            question={item.question}
            phase="answering"
            selectedId={answers[item.id] ?? null}
            onAnswer={(optionId) => answer(item.id, optionId)}
          />
        )}

        <div className="exam__foot">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <Icon name="icArrowL" size={16} /> Zurück
          </button>

          {index < items.length - 1 ? (
            <button type="button" className="btn btn--primary" onClick={() => go(index + 1)}>
              Weiter <Icon name="icArrow" size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={finish}>
              Abgeben
            </button>
          )}
        </div>

        <p className="exam__hint">
          Kein Ergebnis vor dem Ende — du kannst springen und Antworten ändern. Die Prüfung
          läuft weiter, wenn du zwischendurch etwas nachschlägst; die Uhr auch.
        </p>
        <div className="exam__abort">
          <button type="button" className="btn btn--ghost" onClick={finish}>
            Vorzeitig abgeben
          </button>
          <button type="button" className="btn btn--ghost" onClick={verwerfen}>
            Prüfung verwerfen
          </button>
        </div>
      </section>
    );
  }

  /* ── Der Einstieg ───────────────────────────────────────────────────── */
  const deckSize = Object.keys(cards).length;
  const blocked: ExamBlocker | null =
    blocker ?? (deckSize === 0 ? 'emptyDeck' : deckSize < MIN_EXAM_CARDS ? 'tooFewCards' : null);

  return (
    <section className="page exam">
      <header className="exam__header">
        <p className="page__eyebrow">Prüfungsmodus</p>
        <h1 className="page__title">Prüfung</h1>
      </header>

      {blocked ? (
        <EmptyState
          icon="icCards"
          title="Noch keine Prüfung möglich"
          description={blockerText(blocked)}
          action={
            <Link to="/karteikasten" className="btn btn--primary">
              Karteikasten füllen
            </Link>
          }
        />
      ) : (
        <div className="exam-intro">
          <p className="exam-intro__lead">
            Eine Standortbestimmung, kein Training: {Math.min(EXAM_SIZE, deckSize)} Fragen aus
            deinem Kasten, gemischt über die Abrufformen — Multiple Choice, Bild und freier
            Abruf, so wie real geprüft wird.
          </p>

          <ul className="exam-intro__rules">
            <li>
              <Icon name="icClose" size={16} />
              <span>Kein Feedback zwischendurch. Du erfährst am Ende, wie es stand.</span>
            </li>
            <li>
              <Icon name="icTarget" size={16} />
              <span>Eine Minute pro Frage. Der Timer beendet die Prüfung, er bestraft nicht.</span>
            </li>
            <li>
              <Icon name="icCards" size={16} />
              <span>
                Danach wird aus jedem Fehler eine Karte — und die Sitzung startet sofort damit.
              </span>
            </li>
          </ul>

          <button type="button" className="btn btn--primary btn--block" onClick={begin}>
            Prüfung starten
          </button>
        </div>
      )}
    </section>
  );
}
