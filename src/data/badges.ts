/* =========================================================================
   Kompetenz-Abzeichen (Etappe 9b) — reine Ableitung, kein Zustand.
   src/data/badges.ts

   Abzeichen messen **Können, nicht Anwesenheit**. Nicht „7 Tage am Stück!", sondern
   „Rotatorenmanschette komplett" — alle vier Muskeln der Gruppe stehen in Fach ≥ 5.
   Das ist der Unterschied zwischen einem Abzeichen, auf das man stolz sein kann, und
   einem, das man fürs Dasitzen bekommt.

   ⚠️ **HIER WIRD NICHTS GESPEICHERT.** Ein Abzeichen ist eine Rechnung aus
   (Gruppe × Leitner-Box), die jedes Mal neu aufgeht:

       verdient(gruppe)  ⇔  jeder Muskel der Gruppe hat fach ≥ MASTERED_FACH

   Wer „verdiente Abzeichen" persistiert, baut eine **zweite Wahrheit**, die mit der
   Box auseinanderläuft (ADR 0008) — und einen neuen Backup-Schlüssel, den ältere
   Versionen nicht kennen (ADR 0002). Der Nebeneffekt ist ein Feature, kein Fehler:
   **Wer eine Karte vergisst, verliert das Abzeichen wieder.** Kompetenz ist kein Besitz.
   ========================================================================= */

import { MASTERED_FACH } from '../persistence/leitner';
import { getGroups, type MuscleGroup } from './groups';
import type { FlashcardCard } from '../persistence/types';

export interface Badge {
  /** = `MuscleGroup.id`. */
  id: string;
  label: string;
  /** Muskeln der Gruppe. */
  total: number;
  /** Davon in Fach ≥ 5. */
  mastered: number;
  earned: boolean;
  /**
   * Was noch fehlt (`nameLatin`): nicht gemeistert **oder gar nicht im Kasten**.
   * Ein Muskel ohne Karte hat kein Fach — er zählt nicht als gemeistert.
   */
  missing: string[];
}

/** Ist diese Karte gemeistert? Keine Karte = nein (nicht „unbekannt"). */
function isMastered(card: FlashcardCard | undefined): boolean {
  return card !== undefined && card.fach >= MASTERED_FACH;
}

/**
 * Ein Abzeichen je funktioneller Gruppe (9a).
 *
 * Sortiert: **die noch offenen zuerst, die am weitesten fortgeschrittenen davon oben** —
 * der Weg ist der interessante Teil, nicht der Pokal. Die verdienten stehen hinten.
 */
export function badges(
  cards: Record<string, FlashcardCard>,
  groups: readonly MuscleGroup[] = getGroups(),
): Badge[] {
  const all = groups.map((group): Badge => {
    const missing = group.muscles.filter((name) => !isMastered(cards[name]));
    return {
      id: group.id,
      label: group.label,
      total: group.muscles.length,
      mastered: group.muscles.length - missing.length,
      earned: missing.length === 0,
      missing,
    };
  });

  return all.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? 1 : -1;
    // Unter den offenen zuerst die, die am nächsten dran sind.
    return b.mastered / b.total - a.mastered / a.total || a.label.localeCompare(b.label, 'de');
  });
}

/** Nur die verdienten — für den Toast-Vergleich und die Kopfzeile („3 von 15"). */
export function earnedIds(list: readonly Badge[]): string[] {
  return list.filter((b) => b.earned).map((b) => b.id);
}
