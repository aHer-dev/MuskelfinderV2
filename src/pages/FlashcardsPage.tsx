import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMuscleByLatinName } from '../data';
import { Flashcard } from '../components/features/flashcards/Flashcard';
import { LeitnerBoxes } from '../components/features/flashcards/LeitnerBoxes';
import { RatingBar } from '../components/features/flashcards/RatingBar';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import { useProgressStore } from '../store/useProgressStore';
import type { CardRating } from '../types';
import '../components/features/flashcards/flashcards.css';

export function FlashcardsPage() {
  const session = useFlashcardSession();
  const cards = useProgressStore((s) => s.flashcards.cards);
  const deckSize = Object.keys(cards).length;
  const [revealed, setRevealed] = useState(false);

  const byFach = useMemo(() => {
    const acc = Array<number>(8).fill(0);
    for (const card of Object.values(cards)) acc[card.fach]++;
    return acc;
  }, [cards]);
  const activeBox = session.current ? cards[session.current]?.fach : undefined;

  // Beim Kartenwechsel wieder zuklappen.
  useEffect(() => setRevealed(false), [session.current]);

  const handleRate = (rating: CardRating) => {
    session.rate(rating);
    setRevealed(false);
  };

  const muscle = session.current ? getMuscleByLatinName(session.current) : undefined;

  return (
    <section className="page flashcards">
      <header className="flashcards__header">
        <p className="page__eyebrow">Spaced Repetition</p>
        <h1 className="page__title">Lernkarten</h1>
        <Link to="/karteikasten" className="flashcards__manage">
          📋 Muskeln im Karteikasten verwalten{deckSize > 0 ? ` (${deckSize})` : ''} →
        </Link>
      </header>

      {session.total === 0 ? (
        <div className="flashcards__empty">
          {deckSize === 0 ? (
            <p>
              Dein Karteikasten ist leer. Lege über{' '}
              <Link to="/karteikasten">Muskeln verwalten</Link> Karten an — einzeln oder
              ganze Bereiche auf einmal.
            </p>
          ) : (
            <p>Heute ist nichts fällig — {deckSize} Karten im Kasten. Komm später wieder.</p>
          )}
        </div>
      ) : session.done ? (
        <div className="flashcards__done">
          <h2>Sitzung geschafft 🎉</h2>
          <p>
            {session.reviewed} {session.reviewed === 1 ? 'Karte' : 'Karten'} gelernt ·{' '}
            <strong>+{session.xpEarned} XP</strong>
          </p>
          <button type="button" className="btn btn--ghost" onClick={session.restart}>
            Neue Runde
          </button>
        </div>
      ) : (
        <div className="flashcards__session">
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

          {muscle ? (
            <>
              <Flashcard muscle={muscle} revealed={revealed} onReveal={() => setRevealed(true)} />
              <LeitnerBoxes counts={byFach} activeBox={activeBox} />
              <RatingBar onRate={handleRate} disabled={!revealed} />
            </>
          ) : (
            // Karte im Kasten, aber ohne Muskel-Datensatz (verwaister Name) → bewertbar überspringen.
            <div className="flashcards__empty">
              <p>Karte „{session.current}" hat keinen Muskel-Datensatz.</p>
              <RatingBar onRate={handleRate} disabled={false} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
