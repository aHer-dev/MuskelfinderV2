/* =========================================================================
   useFlashcardSession — Sicht auf die laufende Lernsitzung.
   src/hooks/useFlashcardSession.ts

   Der Zustand liegt seit Etappe 7d im `useSessionStore` (er muss die Navigation
   zur Suche überleben). Dieser Hook ist nur noch die abgeleitete Sicht darauf —
   die Seite rechnet nichts selbst aus.
   ========================================================================= */

import type { Lernform } from '../data/quiz-mix';
import {
  useSessionStore,
  type QuizAufdeckung,
  type SessionOptions,
} from '../store/useSessionStore';
import type { CardRating, QuizQuestion } from '../types';

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
  /**
   * Fortschritt für die Anzeige: Karteikarten zählen bewertete KARTEN, der Quiz-Mix
   * beantwortete FRAGEN (eine Karte kommt dort zweimal, siehe `FRAGEN_JE_KARTE`). Zählte der
   * Quiz-Mix Karten, stünde der Balken nach der ersten Runde — 20 Antworten — noch auf null.
   */
  erledigt: number;
  gesamt: number;
  correct: number;
  wrong: number;
  /** Anzahl „Unsicher"-Bewertungen (Karte wurde erneut einsortiert). */
  unsure: number;
  xpEarned: number;
  lernform: Lernform;
  /**
   * Quiz-Mix: die Frage, die gerade auf dem Schirm steht — die aufgedeckte, solange „Weiter"
   * nicht gedrückt ist, sonst die des aktuellen Platzes. `null` heisst: dieser Platz ist eine
   * Lernkarte (Fach 7, oder die Sitzung ist keine Quiz-Sitzung).
   */
  frage: QuizQuestion | null;
  aufgedeckt: QuizAufdeckung | null;
  /**
   * Fertig erst, wenn auch die letzte Antwort gelesen ist. Die Bewertung der letzten Frage
   * leert die Warteschlange sofort — ohne diese Bedingung sprang die Seite auf die
   * Zusammenfassung, bevor man sah, ob die letzte Antwort richtig war.
   */
  done: boolean;
  start: (opts: SessionOptions) => void;
  rate: (rating: CardRating) => void;
  beantworte: (optionId: string) => void;
  weiter: () => void;
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
  const lernform = useSessionStore((s) => s.lernform);
  const fragen = useSessionStore((s) => s.fragen);
  const aufgedeckt = useSessionStore((s) => s.aufgedeckt);
  const plaetzeGesamt = useSessionStore((s) => s.plaetzeGesamt);
  const start = useSessionStore((s) => s.start);
  const rate = useSessionStore((s) => s.rate);
  const beantworte = useSessionStore((s) => s.beantworte);
  const weiter = useSessionStore((s) => s.weiter);
  const exit = useSessionStore((s) => s.exit);

  const current = queue[0] ?? null;

  return {
    started,
    current,
    reviewed,
    total,
    remaining: total - reviewed,
    erledigt: lernform === 'quiz' ? plaetzeGesamt - queue.length : reviewed,
    gesamt: lernform === 'quiz' ? plaetzeGesamt : total,
    correct,
    wrong,
    unsure,
    xpEarned,
    lernform,
    frage: aufgedeckt?.frage ?? fragen[0] ?? null,
    aufgedeckt,
    done: started && queue.length === 0 && aufgedeckt === null,
    start,
    rate,
    beantworte,
    weiter,
    exit,
  };
}
