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

/** Falsch → ein Fach zurück (min 1), neue Fälligkeit, Zähler & lastSeen. */
export function applyWrong(card: FlashcardCard, now: Date = new Date()): FlashcardCard {
  const fach = Math.max(MIN_FACH, card.fach - 1);
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

/** Fällig = nextDue ≤ Tagesende ODER als schwierig markiert. */
export function isDue(card: FlashcardCard, now: Date = new Date()): boolean {
  return new Date(card.nextDue) <= endOfDay(now) || card.difficult;
}
