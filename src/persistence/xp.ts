/* =========================================================================
   XP- & Level-Kurve — eingefroren aus V1 gamification.js (ADR 0002 §4).
   src/persistence/xp.ts

   `cumXP(level) = round(50 · (level − 1)^1.658)`, Level 1 = 0, Cap Level 99.
   Das Level wird IMMER aus totalXP abgeleitet, nie separat gespeichert — so
   ergibt ein importiertes totalXP exakt dasselbe Level wie in V1.
   ========================================================================= */

const XP_SCALE = 50;
const XP_EXPONENT = 1.658;
export const MAX_LEVEL = 99;
/** Fixer Cap-Wert bei Level 99 (V1-identisch, nicht neu berechnet). */
export const MAX_LEVEL_XP = 99780;

/** Gesamt-XP, die benötigt werden, um `level` zu erreichen. Level 1 = 0 XP. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= MAX_LEVEL) return MAX_LEVEL_XP;
  return Math.round(XP_SCALE * Math.pow(level - 1, XP_EXPONENT));
}

/** Aktuelles Level aus totalXP (Binärsuche über die monotone Kurve). */
export function levelFromXP(totalXP: number): number {
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (xpForLevel(mid) <= totalXP) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface XpView {
  totalXP: number;
  level: number;
  /** XP seit Beginn des aktuellen Levels. */
  xpThisLevel: number;
  /** XP-Spanne des aktuellen Levels (bei Level 99: 1, um Division zu vermeiden). */
  xpNeeded: number;
  /** Fortschritt im aktuellen Level, 0..1. */
  progress: number;
}

/** Abgeleitete Sicht auf den XP-Stand (Level, Fortschritt) — für Statistik/HUD. */
export function xpView(totalXP: number): XpView {
  const level = levelFromXP(totalXP);
  const xpThisLevel = totalXP - xpForLevel(level);
  const xpNeeded = level < MAX_LEVEL ? xpForLevel(level + 1) - xpForLevel(level) : 1;
  return {
    totalXP,
    level,
    xpThisLevel,
    xpNeeded,
    progress: Math.min(1, xpThisLevel / xpNeeded),
  };
}

/* ---------- XP-Vergabe (Beträge eingefroren aus V1) -------------------- */

export type FlashcardRating = 'richtig' | 'unsicher' | 'falsch';

const FLASHCARD_BASE: Record<FlashcardRating, number> = { richtig: 3, unsicher: 2, falsch: 1 };
const FLASHCARD_FACH_BONUS: Record<number, number> = { 5: 1, 6: 2, 7: 2 };
const STREAK_BONUS: Record<number, number> = { 5: 5, 10: 10, 20: 20 };

/** XP für eine bewertete Lernkarte: Basis nach Rating + Fach-Bonus (Fach VOR Bewertung). */
export function flashcardXp(rating: FlashcardRating, fach: number): number {
  return (FLASHCARD_BASE[rating] ?? 1) + (FLASHCARD_FACH_BONUS[fach] ?? 0);
}

/** Streak-Bonus bei genau 5/10/20 richtigen in Folge, sonst 0. */
export function streakXp(count: number): number {
  return STREAK_BONUS[count] ?? 0;
}

/** Fixer Tagesbonus. */
export const DAILY_BONUS_XP = 10;
