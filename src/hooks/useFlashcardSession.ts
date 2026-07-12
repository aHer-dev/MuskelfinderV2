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
import { notifyAward } from '../store/useToastStore';
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
  /**
   * Vorpriorisierte Auswahl (Etappe 7b): der Tagesplan aus `data/today.ts` hat die
   * Karten bereits sortiert und gedeckelt. Ist sie gesetzt, gilt ihre Reihenfolge —
   * `scope` entfällt, `limit` deckelt weiterhin. Nicht mehr fällige Namen fallen raus.
   */
  names?: string[];
}

/**
 * Router-State, mit dem `/heute` eine fertige Auswahl an `/lernkarten` übergibt (7b).
 * Bewusst validiert statt gecastet: der State kommt aus der History und kann alles sein.
 */
export function readSessionHandoff(state: unknown): SessionOptions | null {
  if (typeof state !== 'object' || state === null) return null;
  const start = (state as { start?: unknown }).start;
  if (typeof start !== 'object' || start === null) return null;

  const { names, limit, scope } = start as { names?: unknown; limit?: unknown; scope?: unknown };
  if (!Array.isArray(names) || !names.every((n) => typeof n === 'string') || names.length === 0) {
    return null;
  }
  return {
    names,
    limit: typeof limit === 'number' ? limit : 0,
    scope: scope === 'upper' || scope === 'lower' || scope === 'trunk' || scope === 'head' ? scope : 'all',
  };
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

/** Fällige Karten für einen Bereich (oder eine vorgegebene Auswahl), optional auf `limit` gekürzt. */
export function buildQueue(opts: SessionOptions): string[] {
  const store = useProgressStore.getState();

  // Vorgegebene Auswahl: Reihenfolge übernehmen, nur die Fälligkeit noch prüfen.
  if (opts.names) {
    const due = new Set(store.getDueCards(opts.names));
    const queue = opts.names.filter((name) => due.has(name));
    return opts.limit > 0 ? queue.slice(0, opts.limit) : queue;
  }

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
      notifyAward(award);
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
