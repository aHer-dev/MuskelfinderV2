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
import { applyCardFilter, isCardFilter, type CardFilter } from '../data/card-filter';
import { dailyDose, daysUntilExam } from '../data/today';
import { isDue } from '../persistence/leitner';
import { useProfileStore } from './useProfileStore';
import { useProgressStore } from './useProgressStore';
import { useStreakStore } from './useStreakStore';
import { notifyAward, notifyToast } from './useToastStore';
import type { FlashcardCard } from '../persistence/types';
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
  /**
   * Lücken-Filter (Etappe 8b), additiv: „nur falsch beantwortete", „nie gesehen",
   * „schwierig markiert". Fehlt er, ist alles wie vorher (`'all'`).
   */
  filter?: CardFilter;
}

/**
 * Fällige Karten für einen Bereich (oder eine vorgegebene Auswahl), gefiltert und
 * optional auf `limit` gekürzt.
 *
 * Der Filter setzt sich VOR den Deckel und HINTER die Fälligkeit — er nimmt Karten
 * weg, ohne die Reihenfolge anzufassen (8b). Die Vorpriorisierung aus 7b überlebt das.
 */
export function buildQueue(
  opts: SessionOptions,
  cards: Record<string, FlashcardCard> = useProgressStore.getState().flashcards.cards,
): string[] {
  const filter = opts.filter ?? 'all';
  const now = new Date();
  const dueNow = (name: string): boolean => {
    const card = cards[name];
    return card !== undefined && isDue(card, now);
  };

  const cut = (queue: string[]): string[] => {
    const filtered = applyCardFilter({ cards, candidates: queue, filter });
    return opts.limit > 0 ? filtered.slice(0, opts.limit) : filtered;
  };

  // Vorgegebene Auswahl: Reihenfolge übernehmen, nur die Fälligkeit noch prüfen.
  if (opts.names) return cut(opts.names.filter(dueNow));

  const inScope =
    opts.scope === 'all'
      ? Object.keys(cards)
      : getMuscles()
          .filter((m) => m.region === opts.scope)
          .map((m) => m.nameLatin)
          .filter((name) => name in cards);

  return cut(inScope.filter(dueNow));
}

/**
 * Router-State, mit dem `/heute` eine fertige Auswahl an `/lernkarten` übergibt (7b).
 * Bewusst validiert statt gecastet: der State kommt aus der History und kann alles sein.
 */
export function readSessionHandoff(state: unknown): SessionOptions | null {
  if (typeof state !== 'object' || state === null) return null;
  const start = (state as { start?: unknown }).start;
  if (typeof start !== 'object' || start === null) return null;

  const { names, limit, scope, filter } = start as {
    names?: unknown;
    limit?: unknown;
    scope?: unknown;
    filter?: unknown;
  };
  if (!Array.isArray(names) || !names.every((n) => typeof n === 'string') || names.length === 0) {
    return null;
  }
  return {
    names,
    limit: typeof limit === 'number' ? limit : 0,
    scope: scope === 'upper' || scope === 'lower' || scope === 'trunk' || scope === 'head' ? scope : 'all',
    filter: isCardFilter(filter) ? filter : 'all',
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

    /* Tages-Streak (7f): Jede bewertete Karte zaehlt auf die heutige Dosis ein — die
       gleiche Dosis, die der Tagesplan vorschlaegt (ein naher Pruefungstermin hebt sie).
       Der Streak waechst genau einmal am Tag, das Doppelte verdient einen Freeze. */
    const { examDate } = useProfileStore.getState();
    const dose = dailyDose(daysUntilExam(examDate));
    const { completedToday, earnedFreeze } = useStreakStore.getState().review(dose);
    if (completedToday) notifyToast('Tagesdosis geschafft');
    if (earnedFreeze) notifyToast('Freeze verdient — ein Fehltag ist abgesichert');

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
