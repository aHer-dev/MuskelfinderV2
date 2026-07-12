import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMuscleByLatinName, getMuscles, getRegions } from '../data';
import { regionLabel } from '../data/labels';
import { isDue } from '../persistence/leitner';
import { Flashcard } from '../components/features/flashcards/Flashcard';
import { LeitnerBoxes } from '../components/features/flashcards/LeitnerBoxes';
import { RatingBar } from '../components/features/flashcards/RatingBar';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import type { RegionScope } from '../hooks/useFlashcardSession';
import { useProgressStore } from '../store/useProgressStore';
import { Icon } from '../components/ui/Icon';
import type { CardRating, Muscle, RegionId } from '../types';
import '../components/features/flashcards/flashcards.css';

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[];
const ALL_MUSCLES = getMuscles();
const LIMITS = [0, 5, 10, 20, 50];

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

/** Namen der Muskeln je Bereich (für Scope-gefilterte Fälligkeitszählung). */
const NAMES_BY_REGION: Record<RegionId, Set<string>> = REGION_ORDER.reduce(
  (acc, r) => {
    acc[r] = new Set(ALL_MUSCLES.filter((m) => m.region === r).map((m) => m.nameLatin));
    return acc;
  },
  {} as Record<RegionId, Set<string>>,
);

export function FlashcardsPage() {
  const session = useFlashcardSession();
  const cards = useProgressStore((s) => s.flashcards.cards);
  const deckSize = Object.keys(cards).length;

  const [limit, setLimit] = useState(0);
  const [scope, setScope] = useState<RegionScope>('all');

  const byFach = useMemo(() => {
    const acc = Array<number>(8).fill(0);
    for (const card of Object.values(cards)) acc[card.fach]++;
    return acc;
  }, [cards]);

  const dueForScope = useMemo(() => {
    const now = new Date();
    let n = 0;
    for (const [name, card] of Object.entries(cards)) {
      if (scope !== 'all' && !NAMES_BY_REGION[scope].has(name)) continue;
      if (isDue(card, now)) n++;
    }
    return n;
  }, [cards, scope]);

  return (
    <section className="page flashcards">
      <header className="flashcards__header">
        <p className="page__eyebrow">Spaced Repetition</p>
        <h1 className="page__title">Lernkarten</h1>
        <Link to="/karteikasten" className="flashcards__manage">
          <Icon name="icList" size={16} />
          <span>
            Muskeln im Karteikasten verwalten{deckSize > 0 ? ` (${deckSize})` : ''}
          </span>
          <Icon name="icArrow" size={16} />
        </Link>
      </header>

      {!session.started ? (
        <SetupScreen
          deckSize={deckSize}
          dueForScope={dueForScope}
          byFach={byFach}
          limit={limit}
          scope={scope}
          onLimit={setLimit}
          onScope={setScope}
          onStart={() => session.start({ limit, scope })}
        />
      ) : session.done ? (
        <SummaryScreen
          session={session}
          byFach={byFach}
          onContinue={() => session.start({ limit, scope })}
          canContinue={dueForScope > 0}
        />
      ) : (
        <CardScreen session={session} byFach={byFach} cards={cards} />
      )}
    </section>
  );
}

/* ── Setup ────────────────────────────────────────────────────────────── */
function SetupScreen({
  deckSize,
  dueForScope,
  byFach,
  limit,
  scope,
  onLimit,
  onScope,
  onStart,
}: {
  deckSize: number;
  dueForScope: number;
  byFach: number[];
  limit: number;
  scope: RegionScope;
  onLimit: (n: number) => void;
  onScope: (s: RegionScope) => void;
  onStart: () => void;
}) {
  const resetProgress = useProgressStore((s) => s.resetProgress);

  if (deckSize === 0) {
    return (
      <div className="flashcards__empty">
        <p>
          Dein Karteikasten ist leer. Lege über <Link to="/karteikasten">Muskeln verwalten</Link>{' '}
          Karten an — einzeln oder ganze Bereiche auf einmal.
        </p>
      </div>
    );
  }

  return (
    <div className="fc-setup">
      <div className="fc-setup__due">
        <span className="fc-setup__due-num">{dueForScope}</span>
        <span className="fc-setup__due-label">
          {dueForScope === 1 ? 'Karte' : 'Karten'} heute fällig
        </span>
      </div>

      <div className="fc-setup__controls">
        <label className="fc-field">
          <span className="fc-field__label">Bereich</span>
          <select
            className="fc-select"
            value={scope}
            onChange={(e) => onScope(e.target.value as RegionScope)}
          >
            <option value="all">Alle Bereiche</option>
            {REGION_ORDER.map((r) => (
              <option key={r} value={r}>
                {regionLabel(r)}
              </option>
            ))}
          </select>
        </label>

        <label className="fc-field">
          <span className="fc-field__label">Kartenlimit</span>
          <select
            className="fc-select"
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
          >
            {LIMITS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Alle fälligen' : `${n} Karten`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={onStart}
        disabled={dueForScope === 0}
      >
        {dueForScope === 0 ? 'Nichts fällig' : 'Lernen starten'}
      </button>

      <div className="fc-setup__section">
        <h2 className="fc-setup__subtitle">Fächer-Übersicht</h2>
        <LeitnerBoxes counts={byFach} />
      </div>

      <div className="fc-setup__section">
        <h2 className="fc-setup__subtitle">Speicherstand</h2>
        <p className="fc-setup__hint">Fortschritt wird automatisch im Browser gespeichert.</p>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            if (confirm('Gesamten Lernfortschritt (Fächer + XP) wirklich zurücksetzen?')) {
              resetProgress();
            }
          }}
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */
function CardScreen({
  session,
  byFach,
  cards,
}: {
  session: ReturnType<typeof useFlashcardSession>;
  byFach: number[];
  cards: Record<string, { fach: number; difficult: boolean }>;
}) {
  const toggleDifficult = useProgressStore((s) => s.toggleDifficult);
  const [revealed, setRevealed] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const current = session.current;
  const muscle: Muscle | undefined = current ? getMuscleByLatinName(current) : undefined;
  const difficult = current ? (cards[current]?.difficult ?? false) : false;
  const activeBox = current ? cards[current]?.fach : undefined;

  // Beim Kartenwechsel Zustand zurücksetzen.
  useEffect(() => {
    setRevealed(false);
    setShowImage(false);
  }, [current]);

  const rate = (rating: CardRating) => {
    session.rate(rating);
    setRevealed(false);
  };

  // Tastatursteuerung (V1): Space=Aufdecken, 1/2/3=Falsch/Unsicher/Richtig, F=Schwierig.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        if (current) toggleDifficult(current);
        return;
      }
      if (!revealed) return;
      if (e.key === '1') rate('wrong');
      else if (e.key === '2') rate('unsure');
      else if (e.key === '3') rate('correct');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Swipe (mobil): nach Aufdecken → rechts = Richtig, links = Falsch.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !revealed) {
      touchStartX.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > 60) rate('correct');
    else if (dx < -60) rate('wrong');
  };

  return (
    <div className="flashcards__session" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="fc-session-head">
        <button
          type="button"
          className="fc-icon-btn"
          onClick={session.exit}
          aria-label="Zur Übersicht"
        >
          ←
        </button>
        <div className="flashcards__progress" aria-label="Fortschritt">
          <div className="flashcards__progress-track">
            <div
              className="flashcards__progress-fill"
              style={{ width: `${(session.reviewed / session.total) * 100}%` }}
            />
          </div>
          <span className="flashcards__progress-label">
            {session.reviewed}/{session.total}
          </span>
        </div>
        <button
          type="button"
          className={`fc-icon-btn fc-flag${difficult ? ' fc-flag--on' : ''}`}
          onClick={() => current && toggleDifficult(current)}
          aria-pressed={difficult}
          aria-label="Als schwierig markieren"
          title="Als schwierig markieren (F)"
        >
          <Icon name="icFlag" size={18} />
        </button>
      </div>

      {muscle ? (
        <>
          {muscle.images.length > 0 && (
            <div className="fc-image-panel">
              <button
                type="button"
                className="fc-image-toggle"
                aria-expanded={showImage}
                onClick={() => setShowImage((v) => !v)}
              >
                {showImage ? 'Bild verbergen' : 'Mit Bild anzeigen'}
              </button>
              {showImage && (
                <img
                  className="fc-image"
                  src={assetUrl(muscle.images[0].url)}
                  alt={`${muscle.nameLatin} — ${muscle.images[0].view}`}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          )}

          <Flashcard muscle={muscle} revealed={revealed} onReveal={() => setRevealed(true)} />
          <LeitnerBoxes counts={byFach} activeBox={activeBox} />
          {/* V1-Parität: erst aufdecken, dann bewerten — kein deaktivierter „Toter-Klick"-Zustand. */}
          {revealed ? (
            <>
              <RatingBar onRate={rate} disabled={false} />
              <p className="fc-controls-hint">
                <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> bewerten · <kbd>F</kbd> schwierig ·
                mobil: wischen
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => setRevealed(true)}
              >
                Karte aufdecken
              </button>
              <p className="fc-controls-hint">
                <kbd>Space</kbd> oder tippen zum Aufdecken
              </p>
            </>
          )}
        </>
      ) : (
        <div className="flashcards__empty">
          <p>Karte „{current}" hat keinen Muskel-Datensatz.</p>
          <RatingBar onRate={rate} disabled={false} />
        </div>
      )}
    </div>
  );
}

/* ── Summary ──────────────────────────────────────────────────────────── */
function SummaryScreen({
  session,
  byFach,
  onContinue,
  canContinue,
}: {
  session: ReturnType<typeof useFlashcardSession>;
  byFach: number[];
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="fc-summary">
      <div className="flashcards__done">
        <Icon name="icCheck" size={32} className="flashcards__done-icon" />
        <h2>Sitzung geschafft</h2>
        <div className="fc-summary__stats">
          <div className="fc-summary__stat">
            <span className="fc-summary__num">{session.reviewed}</span>
            <span className="fc-summary__label">gelernt</span>
          </div>
          <div className="fc-summary__stat">
            <span className="fc-summary__num fc-summary__num--ok">{session.correct}</span>
            <span className="fc-summary__label">richtig</span>
          </div>
          <div className="fc-summary__stat">
            <span className="fc-summary__num fc-summary__num--bad">{session.wrong}</span>
            <span className="fc-summary__label">falsch</span>
          </div>
          <div className="fc-summary__stat">
            <span className="fc-summary__num fc-summary__num--xp">+{session.xpEarned}</span>
            <span className="fc-summary__label">XP</span>
          </div>
        </div>
      </div>

      <div className="fc-setup__section">
        <h2 className="fc-setup__subtitle">Fächer nach der Sitzung</h2>
        <LeitnerBoxes counts={byFach} />
      </div>

      <div className="fc-summary__actions">
        <button type="button" className="btn btn--primary" onClick={onContinue} disabled={!canContinue}>
          {canContinue ? 'Weiter lernen' : 'Nichts mehr fällig'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={session.exit}>
          Zur Übersicht
        </button>
      </div>
    </div>
  );
}
