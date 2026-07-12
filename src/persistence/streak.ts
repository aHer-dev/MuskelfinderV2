/* =========================================================================
   Tages-Streak mit Freeze (Etappe 7f) — reine Logik, keine Persistenz.
   src/persistence/streak.ts

   ACHTUNG, Begriffskollision: „streak" heißt im Quiz die *Antwortserie*
   (5/10/20 richtige nacheinander → `streakXp`). Hier geht es um etwas anderes:
   aufeinanderfolgende **Tage** mit erledigter Tagesdosis.

   Haltung (Rahmen-Briefing, Nicht-Ziele): Der Streak ist ein Grund
   wiederzukommen — **keine Schuld-Mechanik**. Ein verpasster Tag darf nicht der
   Anfang vom Aufhören sein. Darum der Freeze: durch Überperformen *verdient*,
   bei einem Fehltag **automatisch** eingelöst, ohne Nachfrage. Und wenn der
   Streak doch reißt, lautet die Botschaft „weiter geht's" — nie „du hast X
   verloren".
   ========================================================================= */

import type { StreakSection } from './types';

/** Maximal so viele Freezes liegen auf dem Konto. Sonst wird Vorsprung hortbar. */
export const MAX_FREEZES = 2;
/** Ab dem Doppelten der Tagesdosis ist ein Freeze verdient (einer pro Tag). */
export const FREEZE_EARN_FACTOR = 2;

/** Lokaler Tagesstempel „YYYY-MM-DD". Bewusst lokal: der Tag der Nutzerin, nicht UTC. */
export function dayStamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Ganze Tage zwischen zwei Tagesstempeln (b − a). Negativ, wenn b vor a liegt. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  // Mittag als Anker: so kippt die Differenz auch über Sommerzeitwechsel nicht.
  const start = new Date(ay, am - 1, ad, 12).getTime();
  const end = new Date(by, bm - 1, bd, 12).getTime();
  return Math.round((end - start) / 86_400_000);
}

/** Was beim Tageswechsel passiert ist — das UI formuliert daraus die (freundliche) Botschaft. */
export type StreakEvent =
  /** Nichts zu tun (gleicher Tag, oder nie ein Streak gewesen). */
  | 'none'
  /** Fehltag(e) wurden mit Freeze(s) überbrückt — der Streak steht noch. */
  | 'freeze-used'
  /** Der Streak ist gerissen. Keine Schuldzuweisung, nur ein neuer Anlauf. */
  | 'reset';

export interface RollOverResult {
  streak: StreakSection;
  event: StreakEvent;
  /** Wie viele Freezes dabei verbraucht wurden. */
  freezesUsed: number;
}

/**
 * Tageswechsel abrechnen — beim Öffnen der App. Fehltage zwischen dem letzten
 * erfüllten Tag und heute werden, soweit möglich, mit Freezes überbrückt; reichen
 * sie nicht, beginnt der Streak neu.
 *
 * Springt die Uhr **zurück** (heute liegt vor dem letzten erfüllten Tag), passiert
 * nichts: Ein manipuliertes Datum darf den Streak weder aufblähen noch zerstören.
 */
export function rollOverStreak(streak: StreakSection, now: Date = new Date()): RollOverResult {
  const today = dayStamp(now);

  // Tageszähler gehört zum Tag — über Mitternacht beginnt er bei null.
  const base: StreakSection =
    streak.day === today
      ? streak
      : { ...streak, day: today, reviewedToday: 0, earnedFreezeToday: false };

  if (base.lastCompletedDay === null) {
    return { streak: base, event: 'none', freezesUsed: 0 };
  }

  const gap = daysBetween(base.lastCompletedDay, today);

  // Gleicher Tag, Folgetag oder Uhr zurückgedreht → nichts abzurechnen.
  // (Folgetag: der Streak lebt, bis der Tag ohne Dosis vorbei ist.)
  if (gap <= 1) {
    return { streak: base, event: 'none', freezesUsed: 0 };
  }

  const missedDays = gap - 1;
  if (missedDays <= base.freezes) {
    return {
      streak: { ...base, freezes: base.freezes - missedDays, lastCompletedDay: previousDay(today) },
      event: 'freeze-used',
      freezesUsed: missedDays,
    };
  }

  // Nicht genug Freezes: neu anfangen. Die verbliebenen Freezes bleibt sie behalten —
  // sie waren verdient, und ein Entzug wäre eine Strafe.
  return {
    streak: { ...base, current: 0, lastCompletedDay: null },
    event: 'reset',
    freezesUsed: 0,
  };
}

/** Der Vortag von `day` als Stempel. */
function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() - 1);
  return dayStamp(date);
}

export interface ReviewResult {
  streak: StreakSection;
  /** Heute wurde die Tagesdosis gerade erfüllt (genau einmal pro Tag true). */
  completedToday: boolean;
  /** Es wurde gerade ein Freeze verdient. */
  earnedFreeze: boolean;
}

/**
 * Eine bewertete Karte verbuchen. Ist die Tagesdosis damit erfüllt, wächst der
 * Streak (höchstens einmal pro Tag); beim Doppelten der Dosis wird ein Freeze
 * verdient (ebenfalls höchstens einer pro Tag, gedeckelt bei `MAX_FREEZES`).
 */
export function recordReview(
  streak: StreakSection,
  dose: number,
  now: Date = new Date(),
): ReviewResult {
  const today = dayStamp(now);
  const base: StreakSection =
    streak.day === today
      ? streak
      : { ...streak, day: today, reviewedToday: 0, earnedFreezeToday: false };

  const reviewedToday = base.reviewedToday + 1;
  const target = Math.max(1, dose);

  // Der Streak zählt einen Tag genau einmal — auch wenn danach weitergelernt wird.
  const alreadyCountedToday = base.lastCompletedDay === today;
  const completedToday = !alreadyCountedToday && reviewedToday >= target;

  const current = completedToday ? base.current + 1 : base.current;

  const earnedFreeze =
    !base.earnedFreezeToday &&
    base.freezes < MAX_FREEZES &&
    reviewedToday >= target * FREEZE_EARN_FACTOR;

  return {
    streak: {
      ...base,
      reviewedToday,
      current,
      best: Math.max(base.best, current),
      lastCompletedDay: completedToday ? today : base.lastCompletedDay,
      freezes: earnedFreeze ? base.freezes + 1 : base.freezes,
      earnedFreezeToday: base.earnedFreezeToday || earnedFreeze,
    },
    completedToday,
    earnedFreeze,
  };
}
