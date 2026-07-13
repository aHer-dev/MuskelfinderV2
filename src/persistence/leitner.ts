/* =========================================================================
   Leitner-Kernlogik — 7 Fächer, eingefroren aus V1 progress.js (ADR 0002 §3).
   src/persistence/leitner.ts

   Reine Transitions- & Fälligkeits-Logik ohne Persistenz — der Store ruft sie.
   Karten werden nach Muskelname geschlüsselt (ADR 0002 §2); dieses Modul kennt
   nur die Kartenform, nicht den Schlüssel.
   ========================================================================= */

import { type FlashcardCard } from './types';

/** Intervalle in Tagen, Index = Fach-Nummer (Index 0 ungenutzt). */
export const FACH_INTERVALS = [0, 1, 3, 7, 14, 30, 90, 180] as const;
export const MIN_FACH = 1;
export const MAX_FACH = 7;
/** Ab diesem Fach gilt eine Karte als „gemeistert" (V1: fach ≥ 5). */
export const MASTERED_FACH = 5;

/* ── Was mit einer VERGESSENEN Karte passiert (Etappe 12, 2026-07-13) ────────
   Bis dahin fiel eine falsch beantwortete Karte **genau ein Fach** zurück. Gemessen
   hieß das: Wer einen Muskel sechsmal richtig hatte (Fach 7) und ihn dann vergaß, sah
   ihn **erst in 90 Tagen wieder** — er hatte gerade bewiesen, dass er ihn NICHT weiß.
   Aus dem „gemeisterten" Fach 5 waren es immer noch 14 Tage. Das ist genau verkehrt herum.

   (Es war auch nie echtes Leitner: Sebastian Leitners Original wirft eine falsche Karte
   zurück in Fach 1. Das „ein Fach zurück" war eine aufgeweichte Variante aus V1.)

   Entscheidung des Projektinhabers: **höchstens Fach 2** — eine vergessene Karte kommt in
   3 Tagen wieder, nie in 90. Streng genug, um zu wirken; milder als Leitners Original,
   das eine reife Karte nach einem einzigen Patzer komplett zurückwirft.

   **Das Datenformat bleibt unangetastet** (ADR 0002): `fach` ist weiterhin 1–7, `nextDue`
   weiterhin ein ISO-Datum. Nur die Übergangsregel ändert sich. */
export const LAPSE_FACH = 2;

/**
 * Wohin eine vergessene Karte fällt. **Immer mindestens ein Fach runter, und nie höher
 * als `LAPSE_FACH`** — die zweite Bedingung behebt den 90-Tage-Fehler, die erste sorgt
 * dafür, dass auch eine Karte in Fach 2 noch etwas zu verlieren hat (sonst wäre eine
 * falsche Antwort dort folgenlos).
 */
export function lapseFach(fach: number): number {
  return Math.max(MIN_FACH, Math.min(fach - 1, LAPSE_FACH));
}

/** Frische Karte: Fach 1, sofort fällig. */
export function newCard(now: Date = new Date()): FlashcardCard {
  return {
    fach: 1,
    nextDue: now.toISOString(),
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}

/** Fälligkeitsdatum für ein Fach: heute + Intervall, auf Tagesbeginn normalisiert. */
export function dueDate(fach: number, now: Date = new Date()): string {
  const clamped = Math.min(MAX_FACH, Math.max(MIN_FACH, Math.floor(fach)));
  const d = new Date(now);
  d.setDate(d.getDate() + FACH_INTERVALS[clamped]);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Ende des heutigen Tages — Fälligkeits-Grenze für „heute dran". */
export function endOfDay(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Richtig → ein Fach hoch (max 7), neue Fälligkeit, Zähler & lastSeen. */
export function applyCorrect(card: FlashcardCard, now: Date = new Date()): FlashcardCard {
  const fach = Math.min(MAX_FACH, card.fach + 1);
  return {
    ...card,
    fach,
    nextDue: dueDate(fach, now),
    totalCorrect: card.totalCorrect + 1,
    lastSeen: now.toISOString(),
  };
}

/** Falsch → zurück nach `lapseFach` (höchstens Fach 2), neue Fälligkeit, Zähler & lastSeen. */
export function applyWrong(card: FlashcardCard, now: Date = new Date()): FlashcardCard {
  const fach = lapseFach(card.fach);
  return {
    ...card,
    fach,
    nextDue: dueDate(fach, now),
    totalWrong: card.totalWrong + 1,
    lastSeen: now.toISOString(),
  };
}

/** Unsicher → Fach & Fälligkeit bleiben, nur lastSeen aktualisieren. */
export function applyUnsure(card: FlashcardCard, now: Date = new Date()): FlashcardCard {
  return { ...card, lastSeen: now.toISOString() };
}

/**
 * Fehltreffer in der Prüfung (Etappe 9c) — eine eigene Transition, kein Ersatz für
 * `applyWrong`.
 *
 * Zwei Dinge müssen hier gleichzeitig gelten, und keine bestehende Transition kann beide:
 * 1. **Zurückgestuft.** Wer den Muskel in der Prüfung nicht wusste, weiß ihn nicht.
 *    Ohne die Rückstufung hebt die Debrief-Sitzung ihn beim ersten Treffer sogar noch
 *    ÜBER sein altes Fach — die Prüfung würde eine Lücke belohnen.
 * 2. **Sofort wieder fällig.** `applyWrong` legt die Karte auf `dueDate(fach)`, also
 *    frühestens auf morgen (Fach 1 = 1 Tag). Das Debrief übt sie aber JETZT: `buildQueue`
 *    filtert auf `isDue`, und eine nicht fällige Karte fiele aus der Sitzung — der
 *    Primärbutton führte ins Leere (die Regel aus 8c).
 *
 * **Etappe 12:** Die Rückstufung benutzt jetzt dieselbe Regel wie `applyWrong` (`lapseFach`,
 * höchstens Fach 2). Vorher fiel eine verpasste Karte nur EIN Fach — aus Fach 7 also auf 6,
 * und ein einziger Treffer im Debrief hob sie zurück auf 7: **180 Tage weg, einen Tag nach
 * der Prüfung, in der sie gefehlt hat.** Der Fehler steckte hier nur einen Schritt tiefer
 * als in `applyWrong`.
 *
 * Intervalle, Fächergrenzen und `isDue` bleiben unangetastet; es sind ausschließlich
 * V1-Felder betroffen (ADR 0002). XP gibt es hier keine — die verdient die Sitzung danach.
 */
export function applyExamMiss(card: FlashcardCard, now: Date = new Date()): FlashcardCard {
  return {
    ...card,
    fach: lapseFach(card.fach),
    nextDue: now.toISOString(),
    totalWrong: card.totalWrong + 1,
    lastSeen: now.toISOString(),
  };
}

/** Fällig = nextDue ≤ Tagesende ODER als schwierig markiert. */
export function isDue(card: FlashcardCard, now: Date = new Date()): boolean {
  return new Date(card.nextDue) <= endOfDay(now) || card.difficult;
}
