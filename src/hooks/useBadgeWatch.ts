/* =========================================================================
   useBadgeWatch — meldet ein frisch verdientes Abzeichen (Etappe 9b).
   src/hooks/useBadgeWatch.ts

   Ein Abzeichen ist eine Ableitung, kein Zustand — es gibt also nichts, woran man
   „neu verdient" ablesen könnte. Die einzige Wahrheit ist der Vergleich mit dem, was
   vorhin galt: Der Hook merkt sich die verdienten Abzeichen **im Arbeitsspeicher der
   laufenden Sitzung** und meldet, was dazugekommen ist.

   ⚠️ Bewusst NICHT persistiert. Sonst hätten wir genau die zweite Wahrheit, die
   `badges.ts` vermeidet (ADR 0008), plus einen Backup-Schlüssel, den ältere Versionen
   nicht kennen (ADR 0002). Der Preis: Nach einem Browser-Neustart meldet der Hook nichts
   für Abzeichen, die schon standen — das ist richtig so, sie sind ja nicht neu.
   ========================================================================= */

import { useEffect, useRef } from 'react';
import { badges, earnedIds } from '../data/badges';
import { useProgressStore } from '../store/useProgressStore';
import { notifyToast } from '../store/useToastStore';

export function useBadgeWatch(): void {
  const cards = useProgressStore((s) => s.flashcards.cards);
  /** `null` = erster Durchlauf: der Bestand wird nur aufgenommen, nicht gemeldet. */
  const bekannt = useRef<Set<string> | null>(null);

  useEffect(() => {
    const jetzt = new Set(earnedIds(badges(cards)));

    if (bekannt.current === null) {
      bekannt.current = jetzt;
      return;
    }

    for (const badge of badges(cards)) {
      if (badge.earned && !bekannt.current.has(badge.id)) {
        // Ein Satz, kein Feuerwerk (Rahmen-Invariante 7). Die Animation schaltet
        // `prefers-reduced-motion` in toast.css bereits ab.
        notifyToast(`Abzeichen verdient: ${badge.label} komplett`);
      }
    }

    bekannt.current = jetzt;
  }, [cards]);
}
