/* =========================================================================
   useSessionStore — die laufende Lernsitzung (Leitner).
   src/store/useSessionStore.ts

   Warum ein Store und kein `useState` in der Seite (Etappe 7d): Das Suchfeld
   sitzt jetzt in der Kopfzeile JEDER Route. Wer mitten in der Sitzung etwas
   nachschlägt, verlässt `/lernkarten` — läge der Zustand in der Komponente,
   wäre die Sitzung mit dem Unmount weg. Sie liegt darum zentral und übersteht
   die Navigation (CLAUDE.md: „Zustand zentral halten").

   Bewusst NICHT persistiert: eine Sitzung soll einen Seitenwechsel überleben,
   keinen Neustart des Browsers. Die Bewertungen selbst (Fach, Fälligkeit, XP)
   liegen ohnehin schon nach jeder Karte im `useProgressStore`.

   V1-Ablauf: die Sitzung startet über `start(opts)` (Setup-Screen), nicht
   automatisch. Die Warteschlangen-Logik ist rein und getestet.
   ========================================================================= */

import { create } from 'zustand';
import { getMuscles } from '../data';
import { useProgressStore } from './useProgressStore';
import { notifyAward } from './useToastStore';
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

interface SessionState {
  /** Sitzung läuft (Setup verlassen). */
  started: boolean;
  queue: string[];
  /** Kartenanzahl zu Sitzungsbeginn. */
  total: number;
  /** Erledigte Karten (richtig/falsch bewertet). */
  reviewed: number;
  correct: number;
  wrong: number;
  /** Anzahl „Unsicher"-Bewertungen (Karte wurde erneut einsortiert). */
  unsure: number;
  xpEarned: number;

  start: (opts: SessionOptions) => void;
  rate: (rating: CardRating) => void;
  /** Zurück zum Setup (Sitzung abbrechen/beenden). */
  exit: () => void;
}

const IDLE = {
  started: false,
  queue: [] as string[],
  total: 0,
  reviewed: 0,
  correct: 0,
  wrong: 0,
  unsure: 0,
  xpEarned: 0,
};

export const useSessionStore = create<SessionState>()((set, get) => ({
  ...IDLE,

  start: (opts) => {
    const queue = buildQueue(opts);
    set({ ...IDLE, started: true, queue, total: queue.length });
  },

  rate: (rating) => {
    const { queue } = get();
    if (queue.length === 0) return;

    const name = queue[0];
    const award = useProgressStore.getState().reviewCard(name, rating);
    notifyAward(award);

    set((s) => ({
      queue: advanceQueue(s.queue, rating),
      xpEarned: s.xpEarned + award.xpAdded,
      unsure: rating === 'unsure' ? s.unsure + 1 : s.unsure,
      reviewed: rating === 'unsure' ? s.reviewed : s.reviewed + 1,
      correct: rating === 'correct' ? s.correct + 1 : s.correct,
      wrong: rating === 'wrong' ? s.wrong + 1 : s.wrong,
    }));
  },

  exit: () => set({ ...IDLE }),
}));
