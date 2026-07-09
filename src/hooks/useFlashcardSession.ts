/* =========================================================================
   useFlashcardSession — Leitner-Lernsitzung über dem Fortschritts-Store.
   src/hooks/useFlashcardSession.ts

   V1-Ablauf (Etappe 6): die Sitzung wird bewusst über `start(opts)` gestartet
   (Setup-Screen), nicht automatisch. Optionen: Kartenlimit + Bereich (Region).
   Die Warteschlangen-Logik (unsicher → ans Ende, richtig/falsch → raus) ist als
   reine Funktion `advanceQueue` ausgelagert und getestet. Fach-/nextDue-/XP-
   Änderungen macht `useProgressStore.reviewCard` (bereits getestet).
   ========================================================================= */

import { useCallback, useState } from 'react';
import { getMuscles } from '../data';
import { useProgressStore } from '../store/useProgressStore';
import type { CardRating, RegionId } from '../types';

/** Nächste Warteschlange nach einer Bewertung (rein, ohne Seiteneffekte). */
export function advanceQueue(queue: string[], rating: CardRating): string[] {
  if (queue.length === 0) return queue;
  const [current, ...rest] = queue;
  return rating === 'unsure' ? [...rest, current] : rest;
}

export type RegionScope = RegionId | 'all';

export interface SessionOptions {
  /** 0 = alle fälligen, sonst Obergrenze. */
  limit: number;
  scope: RegionScope;
}

export interface FlashcardSessionApi {
  /** Sitzung läuft (Setup verlassen). */
  started: boolean;
  /** Aktueller Kartenname (nameLatin) oder null, wenn die Sitzung leer/fertig ist. */
  current: string | null;
  /** Erledigte Karten (richtig/falsch bewertet). */
  reviewed: number;
  /** Kartenanzahl zu Sitzungsbeginn. */
  total: number;
  /** Noch offene, verschiedene Karten. */
  remaining: number;
  correct: number;
  wrong: number;
  /** Anzahl „Unsicher"-Bewertungen (Karte wurde erneut einsortiert). */
  unsure: number;
  xpEarned: number;
  done: boolean;
  start: (opts: SessionOptions) => void;
  rate: (rating: CardRating) => void;
  /** Zurück zum Setup (Sitzung abbrechen/beenden). */
  exit: () => void;
}

/** Fällige Karten für einen Bereich, optional auf `limit` gekürzt. */
export function buildQueue(opts: SessionOptions): string[] {
  const store = useProgressStore.getState();
  let names: string[] | undefined;
  if (opts.scope !== 'all') {
    names = getMuscles()
      .filter((m) => m.region === opts.scope)
      .map((m) => m.nameLatin);
  }
  const due = store.getDueCards(names);
  return opts.limit > 0 ? due.slice(0, opts.limit) : due;
}

export function useFlashcardSession(): FlashcardSessionApi {
  const reviewCard = useProgressStore((s) => s.reviewCard);
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [unsure, setUnsure] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const start = useCallback((opts: SessionOptions) => {
    const fresh = buildQueue(opts);
    setQueue(fresh);
    setTotal(fresh.length);
    setReviewed(0);
    setCorrect(0);
    setWrong(0);
    setUnsure(0);
    setXpEarned(0);
    setStarted(true);
  }, []);

  const rate = useCallback(
    (rating: CardRating) => {
      if (queue.length === 0) return;
      const name = queue[0];
      const award = reviewCard(name, rating);
      setXpEarned((xp) => xp + award.xpAdded);
      if (rating === 'unsure') {
        setUnsure((u) => u + 1);
      } else {
        setReviewed((r) => r + 1);
        if (rating === 'correct') setCorrect((c) => c + 1);
        else setWrong((w) => w + 1);
      }
      setQueue((q) => advanceQueue(q, rating));
    },
    [queue, reviewCard],
  );

  const exit = useCallback(() => {
    setStarted(false);
    setQueue([]);
  }, []);

  return {
    started,
    current: queue[0] ?? null,
    reviewed,
    total,
    remaining: total - reviewed,
    correct,
    wrong,
    unsure,
    xpEarned,
    done: started && queue.length === 0,
    start,
    rate,
    exit,
  };
}
