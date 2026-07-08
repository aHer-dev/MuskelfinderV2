import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMuscleByLatinName } from '../data';
import { Flashcard } from '../components/features/flashcards/Flashcard';
import { RatingBar } from '../components/features/flashcards/RatingBar';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import { useProgressStore } from '../store/useProgressStore';
import type { CardRating } from '../types';
import '../components/features/flashcards/flashcards.css';

export function FlashcardsPage() {
  const session = useFlashcardSession();
  const deckSize = useProgressStore((s) => Object.keys(s.flashcards.cards).length);
  const [revealed, setRevealed] = useState(false);

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
      </header>

      {session.total === 0 ? (
        <div className="flashcards__empty">
          {deckSize === 0 ? (
            <p>
              Dein Karteikasten ist leer. Öffne einen Muskel in der{' '}
              <Link to="/suche">Suche</Link> und lege ihn über „Zu Lernkarten" ab.
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
