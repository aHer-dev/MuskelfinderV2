/* =========================================================================
   useFlashcardSession — Sicht auf die laufende Lernsitzung.
   src/hooks/useFlashcardSession.ts

   Der Zustand liegt seit Etappe 7d im `useSessionStore` (er muss die Navigation
   zur Suche überleben). Dieser Hook ist nur noch die abgeleitete Sicht darauf —
   die Seite rechnet nichts selbst aus.
   ========================================================================= */

import {
  useSessionStore,
  type SessionOptions,
} from '../store/useSessionStore';
import type { CardRating } from '../types';

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

export function useFlashcardSession(): FlashcardSessionApi {
  const started = useSessionStore((s) => s.started);
  const queue = useSessionStore((s) => s.queue);
  const total = useSessionStore((s) => s.total);
  const reviewed = useSessionStore((s) => s.reviewed);
  const correct = useSessionStore((s) => s.correct);
  const wrong = useSessionStore((s) => s.wrong);
  const unsure = useSessionStore((s) => s.unsure);
  const xpEarned = useSessionStore((s) => s.xpEarned);
  const start = useSessionStore((s) => s.start);
  const rate = useSessionStore((s) => s.rate);
  const exit = useSessionStore((s) => s.exit);

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
