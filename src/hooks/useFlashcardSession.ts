/* =========================================================================
   useFlashcardSession — Leitner-Lernsitzung über dem Fortschritts-Store.
   src/hooks/useFlashcardSession.ts

   Die Warteschlangen-Logik (unsicher → ans Ende, richtig/falsch → raus) ist als
   reine Funktion `advanceQueue` ausgelagert und getestet. Fach-/nextDue-/XP-
   Änderungen macht `useProgressStore.reviewCard` (bereits getestet).
   ========================================================================= */

import { useCallback, useState } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import type { CardRating } from '../types';

/** Nächste Warteschlange nach einer Bewertung (rein, ohne Seiteneffekte). */
export function advanceQueue(queue: string[], rating: CardRating): string[] {
  if (queue.length === 0) return queue;
  const [current, ...rest] = queue;
  return rating === 'unsure' ? [...rest, current] : rest;
}

export interface FlashcardSessionApi {
  /** Aktueller Kartenname (nameLatin) oder null, wenn die Sitzung leer/fertig ist. */
  current: string | null;
  /** Erledigte Karten (richtig/falsch bewertet). */
  reviewed: number;
  /** Kartenanzahl zu Sitzungsbeginn. */
  total: number;
  /** Noch offene, verschiedene Karten. */
  remaining: number;
  xpEarned: number;
  done: boolean;
  rate: (rating: CardRating) => void;
  restart: () => void;
}

function snapshotDue(): string[] {
  return useProgressStore.getState().getDueCards();
}

export function useFlashcardSession(): FlashcardSessionApi {
  const reviewCard = useProgressStore((s) => s.reviewCard);
  const [queue, setQueue] = useState<string[]>(snapshotDue);
  const [total, setTotal] = useState(() => queue.length);
  const [reviewed, setReviewed] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const rate = useCallback(
    (rating: CardRating) => {
      if (queue.length === 0) return;
      const name = queue[0];
      const award = reviewCard(name, rating);
      setXpEarned((xp) => xp + award.xpAdded);
      if (rating !== 'unsure') setReviewed((r) => r + 1);
      setQueue((q) => advanceQueue(q, rating));
    },
    [queue, reviewCard],
  );

  const restart = useCallback(() => {
    const fresh = snapshotDue();
    setQueue(fresh);
    setTotal(fresh.length);
    setReviewed(0);
    setXpEarned(0);
  }, []);

  return {
    current: queue[0] ?? null,
    reviewed,
    total,
    remaining: total - reviewed,
    xpEarned,
    done: queue.length === 0,
    rate,
    restart,
  };
}
