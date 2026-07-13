import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMuscleByLatinName, getRegions } from '../data';
import { regionLabel } from '../data/labels';
import { recallStage } from '../data/recall';
import type { CardFilter } from '../data/card-filter';
import { Flashcard } from '../components/features/flashcards/Flashcard';
import { LeitnerBoxes } from '../components/features/flashcards/LeitnerBoxes';
import { RatingBar } from '../components/features/flashcards/RatingBar';
import { TypeCard } from '../components/features/flashcards/TypeCard';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import { buildQueue, readSessionHandoff, type RegionScope } from '../store/useSessionStore';
import { useProgressStore } from '../store/useProgressStore';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import type { CardRating, Muscle, RegionId } from '../types';
import '../components/features/flashcards/flashcards.css';

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[];
const LIMITS = [0, 5, 10, 20, 50];

/** Die drei Lücken-Filter (8b). „Alle" ist kein Filter, sondern seine Abwesenheit. */
const FILTERS: Array<{ value: CardFilter; label: string }> = [
  { value: 'all', label: 'Alle fälligen Karten' },
  { value: 'wrong', label: 'Nur falsch beantwortete' },
  { value: 'unseen', label: 'Nur nie gesehene' },
  { value: 'difficult', label: 'Nur schwierig markierte' },
];

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

export function FlashcardsPage() {
  const session = useFlashcardSession();
  const cards = useProgressStore((s) => s.flashcards.cards);
  const deckSize = Object.keys(cards).length;

  const [limit, setLimit] = useState(0);
  const [scope, setScope] = useState<RegionScope>('all');
  const [filter, setFilter] = useState<CardFilter>('all');

  /* Übergabe von `/heute` (7b): der Tagesplan hat die Karten bereits ausgewählt und
     sortiert — die Sitzung startet dann ohne Umweg über den Setup-Screen. Pro
     Navigation genau einmal, sonst würde ein Sitzungsabbruch sofort neu starten. */
  const location = useLocation();
  const startSession = session.start;
  const consumedKey = useRef<string | null>(null);
  useEffect(() => {
    if (consumedKey.current === location.key) return;
    const handoff = readSessionHandoff(location.state);
    if (!handoff) return;
    consumedKey.current = location.key;
    startSession(handoff);
  }, [location.key, location.state, startSession]);

  const byFach = useMemo(() => {
    const acc = Array<number>(8).fill(0);
    for (const card of Object.values(cards)) acc[card.fach]++;
    return acc;
  }, [cards]);

  /* Die Zahl auf dem Knopf ist GENAU die Warteschlange, mit der die Sitzung startet —
     sie wird nicht nebenher nachgezählt (sonst laufen Versprechen und Sitzung
     auseinander, sobald ein Filter dazukommt). `limit` bleibt außen vor: es deckelt
     die Sitzung, sagt aber nichts darüber, wie viel der Filter übrig lässt. */
  const dueForScope = useMemo(
    () => buildQueue({ limit: 0, scope, filter }, cards).length,
    [cards, scope, filter],
  );

  return (
    <section className="page flashcards">
      <header className="flashcards__header">
        <p className="page__eyebrow">Spaced Repetition</p>
        <h1 className="page__title">Lernkarten</h1>
        {/* „Lernen" ist der Hub für beide Abrufformen: Karten und Quiz (ADR 0007 —
            das Quiz verliert den Tab-Rang, nicht die Erreichbarkeit). */}
        <div className="flashcards__links">
          <Link to="/karteikasten" className="flashcards__manage">
            <Icon name="icList" size={16} />
            <span>
              Muskeln im Karteikasten verwalten{deckSize > 0 ? ` (${deckSize})` : ''}
            </span>
            <Icon name="icArrow" size={16} />
          </Link>
          {/* Die zehn Quizmodi behalten ihren Platz — als „Freies Üben" für alle, die
              gezielt einen Modus wählen wollen (ADR 0008). */}
          <Link to="/quiz" className="flashcards__manage">
            <Icon name="icQuiz" size={16} />
            <span>Freies Üben — Quizmodus selbst wählen</span>
            <Icon name="icArrow" size={16} />
          </Link>
        </div>
      </header>

      {!session.started ? (
        <SetupScreen
          deckSize={deckSize}
          dueForScope={dueForScope}
          byFach={byFach}
          limit={limit}
          scope={scope}
          filter={filter}
          onLimit={setLimit}
          onScope={setScope}
          onFilter={setFilter}
          onStart={() => session.start({ limit, scope, filter })}
        />
      ) : session.done ? (
        <SummaryScreen
          session={session}
          byFach={byFach}
          onContinue={() => session.start({ limit, scope, filter })}
          canContinue={dueForScope > 0}
        />
      ) : (
        <CardScreen session={session} byFach={byFach} cards={cards} />
      )}
    </section>
  );
}

/* ── Setup ────────────────────────────────────────────────────────────── */
/** Warum die Auswahl leer ist — und wie man da wieder rauskommt (8b). */
function EmptySelection({
  filter,
  scope,
  onFilter,
  onScope,
}: {
  filter: CardFilter;
  scope: RegionScope;
  onFilter: (f: CardFilter) => void;
  onScope: (s: RegionScope) => void;
}) {
  if (filter !== 'all') {
    const label = FILTERS.find((f) => f.value === filter)?.label ?? '';
    return (
      <EmptyState
        icon="icFilter"
        title="Dieser Filter lässt heute nichts übrig"
        description={`„${label}" trifft im gewählten Bereich auf keine fällige Karte. Der Filter grenzt die fälligen Karten ein — er hebt die Fälligkeit nicht auf.`}
        action={
          <button type="button" className="btn btn--primary" onClick={() => onFilter('all')}>
            Filter aufheben
          </button>
        }
      />
    );
  }

  if (scope !== 'all') {
    return (
      <EmptyState
        icon="icFilter"
        title={`In „${regionLabel(scope)}" ist heute nichts fällig`}
        description="In anderen Bereichen wartet vielleicht etwas."
        action={
          <button type="button" className="btn btn--primary" onClick={() => onScope('all')}>
            Alle Bereiche zeigen
          </button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon="icCheck"
      title="Heute ist nichts fällig"
      description="Alle Wiederholungen sind erledigt. Neue Muskeln bringen den Kasten weiter."
      action={
        <Link to="/karteikasten" className="btn btn--primary">
          Neue Muskeln hinzufügen
        </Link>
      }
    />
  );
}

function SetupScreen({
  deckSize,
  dueForScope,
  byFach,
  limit,
  scope,
  filter,
  onLimit,
  onScope,
  onFilter,
  onStart,
}: {
  deckSize: number;
  dueForScope: number;
  byFach: number[];
  limit: number;
  scope: RegionScope;
  filter: CardFilter;
  onLimit: (n: number) => void;
  onScope: (s: RegionScope) => void;
  onFilter: (f: CardFilter) => void;
  onStart: () => void;
}) {
  if (deckSize === 0) {
    return (
      <EmptyState
        icon="icCards"
        title="Dein Karteikasten ist leer"
        description="Lege zuerst Karten an — einzeln oder gleich ein ganzer Bereich. Danach führt dich der Leitner-Algorithmus durch die Wiederholungen."
        action={
          <Link to="/karteikasten" className="btn btn--primary">
            Muskeln hinzufügen
          </Link>
        }
      />
    );
  }

  const filterLabel = FILTERS.find((f) => f.value === filter)?.label ?? '';

  return (
    <div className="fc-setup">
      <div className="fc-setup__due">
        <span className="fc-setup__due-num">{dueForScope}</span>
        <span className="fc-setup__due-label">
          {dueForScope === 1 ? 'Karte' : 'Karten'} heute fällig
          {filter !== 'all' && <em className="fc-setup__due-filter">{filterLabel}</em>}
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
          <span className="fc-field__label">Auswahl</span>
          <select
            className="fc-select"
            value={filter}
            onChange={(e) => onFilter(e.target.value as CardFilter)}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
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

      {/* Ein Filter, der still ins Leere greift, ist eine Falle — hier steht, warum. */}
      {dueForScope === 0 ? (
        <EmptySelection filter={filter} scope={scope} onFilter={onFilter} onScope={onScope} />
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={onStart}>
          Lernen starten
        </button>
      )}

      <div className="fc-setup__section">
        <h2 className="fc-setup__subtitle">Fächer-Übersicht</h2>
        <LeitnerBoxes counts={byFach} />
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

  /* Die Abrufhärte wächst mit der Box (ADR 0008): Ab Fach 7 wird der Name getippt
     statt aufgedeckt und selbst bewertet. Abgeleitet, nirgends gespeichert. */
  const produce = activeBox !== undefined && recallStage(activeBox) === 'produce';

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
      /* Auf der Freitext-Stufe ist die Tastatur die Eingabe: „F" schreibt ein F,
         es markiert nicht die Karte, und Leertaste deckt nichts auf. */
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'f' || e.key === 'F') {
        if (current) toggleDifficult(current);
        return;
      }
      if (produce) return;

      if (e.code === 'Space') {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
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

          {produce ? (
            /* `key`: jede Karte startet mit leerem Feld — sonst stünde die vorige Antwort noch da. */
            <TypeCard key={muscle.id} muscle={muscle} onRate={rate} />
          ) : (
            <Flashcard muscle={muscle} revealed={revealed} onReveal={() => setRevealed(true)} />
          )}

          <LeitnerBoxes counts={byFach} activeBox={activeBox} />

          {/* V1-Parität: erst aufdecken, dann bewerten — kein deaktivierter „Toter-Klick"-Zustand.
              Die Freitext-Stufe bewertet sich selbst und braucht die Leiste nicht. */}
          {!produce &&
            (revealed ? (
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
            ))}
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
