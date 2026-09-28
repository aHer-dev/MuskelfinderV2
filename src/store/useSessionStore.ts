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
import { cardKey, getMuscles } from '../data';
import { applyCardFilter, isCardFilter, type CardFilter } from '../data/card-filter';
import {
  baueQuizMix,
  FRAGEN_JE_KARTE,
  isLernform,
  quizPortion,
  type Lernform,
} from '../data/quiz-mix';
import { dailyDose, daysUntilExam } from '../data/today';
import { isDue } from '../persistence/leitner';
import { useProfileStore } from './useProfileStore';
import { useProgressStore } from './useProgressStore';
import { useStreakStore } from './useStreakStore';
import { notifyAward, notifyToast } from './useToastStore';
import type { FlashcardCard } from '../persistence/types';
import type { CardRating, QuizQuestion, RegionId } from '../types';

/**
 * Nächste Warteschlange nach einer Bewertung (rein, ohne Seiteneffekte). Generisch, weil der
 * Quiz-Mix neben den Namen die Fragen je Platz führt — beide rücken im Gleichschritt.
 */
export function advanceQueue<T>(queue: T[], rating: CardRating): T[] {
  if (queue.length === 0) return queue;
  const [current, ...rest] = queue;
  return rating === 'unsure' ? [...rest, current] : rest;
}

export type RegionScope = RegionId | 'all';

export interface SessionOptions {
  /**
   * 0 = alle fälligen, sonst Obergrenze. Karteikarten: Karten. Quiz-Mix: ANTWORTEN (eine
   * Quiz-Karte kostet `FRAGEN_JE_KARTE`) — so ist „20" in beiden Formen dieselbe Arbeit.
   */
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
  /**
   * Lernform (Etappe 16), additiv: dieselben Karten als Lernkarte oder als Quiz-Mix.
   * Fehlt sie, ist alles wie vorher (`'karten'`).
   */
  lernform?: Lernform;
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
          .map((m) => cardKey(m))
          .filter((key) => key in cards);

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

  const { names, limit, scope, filter, lernform } = start as {
    names?: unknown;
    limit?: unknown;
    scope?: unknown;
    filter?: unknown;
    lernform?: unknown;
  };
  if (!Array.isArray(names) || !names.every((n) => typeof n === 'string') || names.length === 0) {
    return null;
  }
  return {
    names,
    limit: typeof limit === 'number' ? limit : 0,
    scope: scope === 'upper' || scope === 'lower' || scope === 'trunk' || scope === 'head' ? scope : 'all',
    filter: isCardFilter(filter) ? filter : 'all',
    lernform: isLernform(lernform) ? lernform : 'karten',
  };
}

/**
 * Was eine Quiz-Antwort mit der Karte gemacht hat (Etappe 16). Eine Karte rückt im Quiz-Mix
 * erst nach `FRAGEN_JE_KARTE` richtigen Antworten vor; bis dahin bewegt sich nichts.
 */
export type QuizWirkung =
  /** Richtig, aber noch nicht oft genug — die Karte bleibt, wo sie ist. */
  | 'halb'
  /** Die letzte nötige richtige Antwort: ein Fach weiter. */
  | 'hoch'
  /** Falsch: sofort zurück, wie auf der Lernkarte. */
  | 'zurueck'
  /** Eine weitere Frage zu einer Karte, die in dieser Sitzung schon verbucht ist. */
  | 'uebung';

/**
 * Die gerade beantwortete Quizfrage (Quiz-Mix). Sie bleibt stehen, bis „Weiter" gedrückt
 * ist — die Wertung ist da aber längst verbucht.
 */
export interface QuizAufdeckung {
  /** Kartenschlüssel der gefragten Karte. Die Warteschlange zeigt schon auf den nächsten Platz. */
  name: string;
  frage: QuizQuestion;
  selectedId: string;
  richtig: boolean;
  wirkung: QuizWirkung;
  /** Richtige Antworten zu dieser Karte in dieser Sitzung, diese eingeschlossen. */
  richtigBisher: number;
  fachVorher: number;
  fachNachher: number;
}

/** Wie weit eine Karte im Quiz-Mix dieser Sitzung ist. */
interface QuizStand {
  richtig: number;
  /** Die Karte ist bewertet (Fach bewegt) — weitere Fragen zu ihr sind nur noch Übung. */
  verbucht: boolean;
}

interface SessionState {
  /** Sitzung läuft (Setup verlassen). */
  started: boolean;
  /**
   * Was als Nächstes drankommt: Kartenschlüssel. Im Quiz-Mix sind es PLÄTZE — eine Karte
   * steht dort `FRAGEN_JE_KARTE`-mal (siehe `baueQuizMix`).
   */
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
  lernform: Lernform;
  /**
   * Quiz-Mix: die Frage je Platz, im Gleichschritt mit `queue` (`null` = Lernkarte, Fach 7).
   * Beim Start EINMAL gebaut. Läge der Bau in der Seite, würfelte jeder Seitenwechsel (das
   * Suchfeld sitzt auf jeder Route, 7d) eine neue Frage — wer die alte nicht wusste, bekäme
   * nach dem Nachschlagen eine leichtere. Ohne Quiz-Mix leer.
   */
  fragen: Array<QuizQuestion | null>;
  /** Quiz-Mix: Plätze zu Sitzungsbeginn — die Grundlage der Fortschrittsanzeige. */
  plaetzeGesamt: number;
  quizStand: Record<string, QuizStand>;
  aufgedeckt: QuizAufdeckung | null;

  start: (opts: SessionOptions) => void;
  rate: (rating: CardRating) => void;
  /** Quiz-Mix: die aktuelle Frage beantworten. Wertet sofort, genau einmal. */
  beantworte: (optionId: string) => void;
  /** Quiz-Mix: die aufgedeckte Frage wegräumen, zur nächsten. */
  weiter: () => void;
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
  lernform: 'karten' as Lernform,
  fragen: [] as Array<QuizQuestion | null>,
  plaetzeGesamt: 0,
  quizStand: {} as Record<string, QuizStand>,
  aufgedeckt: null as QuizAufdeckung | null,
};

/**
 * Eine Karte bewerten: Leitner-Fach, XP, Tagesdosis. Die EINE Stelle dafür — Lernkarte und
 * Quiz-Mix rufen sie beide, damit eine Karte in beiden Formen genau gleich zählt.
 * `antworten`: was die Karte an Arbeit gekostet hat (Quiz-Mix: `FRAGEN_JE_KARTE`).
 * Gibt die verdienten XP zurück.
 */
function verbuche(name: string, rating: CardRating, antworten = 1): number {
  const award = useProgressStore.getState().reviewCard(name, rating);
  notifyAward(award);

  /* Tages-Streak (7f): Jede bewertete Karte zaehlt auf die heutige Dosis ein — die
     gleiche Dosis, die der Tagesplan vorschlaegt (ein naher Pruefungstermin hebt sie).
     Der Streak waechst genau einmal am Tag, das Doppelte verdient einen Freeze.
     Die Dosis misst ARBEIT: Eine Quiz-Karte zaehlt mit ihren Antworten, sonst waere sie nach
     einer Quiz-Portion (10 Karten, 20 Antworten) nur halb geschafft. Verbucht wird trotzdem
     je Karte einmal — die zweite Frage nach einem Fehler zaehlt nicht noch einmal. */
  const { examDate } = useProfileStore.getState();
  const dose = dailyDose(daysUntilExam(examDate));
  const { completedToday, earnedFreeze } = useStreakStore.getState().review(dose, undefined, antworten);
  if (completedToday) notifyToast('Tagesdosis geschafft');
  if (earnedFreeze) notifyToast('Freeze verdient — ein Fehltag ist abgesichert');

  return award.xpAdded;
}

/** Die Zähler der Zusammenfassung nach einer Bewertung. */
function zaehle(s: SessionState, rating: CardRating, xp: number) {
  return {
    xpEarned: s.xpEarned + xp,
    unsure: rating === 'unsure' ? s.unsure + 1 : s.unsure,
    reviewed: rating === 'unsure' ? s.reviewed : s.reviewed + 1,
    correct: rating === 'correct' ? s.correct + 1 : s.correct,
    wrong: rating === 'wrong' ? s.wrong + 1 : s.wrong,
  };
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  ...IDLE,

  start: (opts) => {
    const lernform = opts.lernform ?? 'karten';
    if (lernform !== 'quiz') {
      const karten = buildQueue(opts);
      set({ ...IDLE, started: true, queue: karten, total: karten.length });
      return;
    }
    /* Im Quiz-Mix zaehlt `limit` ANTWORTEN, nicht Karten: „20" heisst 20 Antworten, also
       10 Karten — dieselbe Arbeit wie 20 Lernkarten (Projektinhaber, 2026-09-28). */
    const { cards } = useProgressStore.getState().flashcards;
    const karten = quizPortion(buildQueue({ ...opts, limit: 0 }), cards, opts.limit);
    const plaetze = baueQuizMix({ names: karten, cards });
    set({
      ...IDLE,
      started: true,
      lernform,
      queue: plaetze.map((p) => p.name),
      fragen: plaetze.map((p) => p.frage),
      total: karten.length,
      plaetzeGesamt: plaetze.length,
    });
  },

  /* Die Antwort zählt SOFORT, nicht erst bei „Weiter". Sonst hiesse ein Seitenwechsel
     zwischen Antwort und „Weiter": nichts verbucht — und wer falsch lag, kaeme zurueck und
     bekaeme dieselbe Frage noch einmal, als waere nichts gewesen.

     **Zwei richtige Antworten je Karte, bevor sie vorrueckt** (Projektinhaber, 2026-09-28,
     `FRAGEN_JE_KARTE`). Auf der Lernkarte reicht eine. Die Karte wird genau EINMAL verbucht:
     beim ersten Fehler (zurueck, wie auf der Lernkarte) oder bei der letzten noetigen
     richtigen Antwort (ein Fach weiter). Was danach noch zu ihr kommt, ist Uebung — die
     zweite Frage nach einem Fehler faellt nicht weg, sie zeigt den Muskel noch einmal in
     einer anderen Form.

     Riegel: `aufgedeckt` wird im selben synchronen Aufruf gesetzt, in dem gewertet wird.
     Ein zweiter Klick (oder Taste) im selben Frame sieht ihn schon und tut nichts — dieselbe
     Regel wie `gewertet` in `useQuizGame`: eine Frage, eine Wertung. */
  beantworte: (optionId) => {
    const { lernform, queue, fragen, aufgedeckt, quizStand } = get();
    if (lernform !== 'quiz' || aufgedeckt !== null || queue.length === 0) return;
    const name = queue[0];
    const frage = fragen[0];
    if (!frage || !frage.options.some((o) => o.id === optionId)) return;

    const richtig = optionId === frage.correctId;
    const stand = quizStand[name] ?? { richtig: 0, verbucht: false };
    const richtigBisher = stand.richtig + (richtig ? 1 : 0);
    const wirkung: QuizWirkung = stand.verbucht
      ? 'uebung'
      : !richtig
        ? 'zurueck'
        : richtigBisher >= FRAGEN_JE_KARTE
          ? 'hoch'
          : 'halb';
    const bewertung: CardRating | null =
      wirkung === 'zurueck' ? 'wrong' : wirkung === 'hoch' ? 'correct' : null;

    const fachVorher = useProgressStore.getState().flashcards.cards[name]?.fach ?? 1;
    const xp = bewertung ? verbuche(name, bewertung, FRAGEN_JE_KARTE) : 0;
    const fachNachher = useProgressStore.getState().flashcards.cards[name]?.fach ?? fachVorher;

    set((s) => ({
      queue: s.queue.slice(1),
      fragen: s.fragen.slice(1),
      quizStand: {
        ...s.quizStand,
        [name]: { richtig: richtigBisher, verbucht: stand.verbucht || bewertung !== null },
      },
      aufgedeckt: { name, frage, selectedId: optionId, richtig, wirkung, richtigBisher, fachVorher, fachNachher },
      ...(bewertung ? zaehle(s, bewertung, xp) : {}),
    }));
  },

  weiter: () => set({ aufgedeckt: null }),

  rate: (rating) => {
    const { queue } = get();
    if (queue.length === 0) return;

    const xp = verbuche(queue[0], rating);
    set((s) => ({
      queue: advanceQueue(s.queue, rating),
      fragen: advanceQueue(s.fragen, rating),
      ...zaehle(s, rating, xp),
    }));
  },

  exit: () => set({ ...IDLE }),
}));
