/* =========================================================================
   useCompleteOnboarding — was nach der zweiten Frage passiert (Etappe 7c).
   src/hooks/useCompleteOnboarding.ts

   **Etappe 10 / ADR 0009 — hier stand das Gegenteil.**

   Bis 2026-07-13 legte dieser Hook 20 Karten an (`seedDeck`) und sprang **direkt in eine
   laufende Sitzung**. Gemessen war die erste Karte, die ein Physio-Schüler je sah,
   `M. abductor digiti minimi` — ein kleiner Fußmuskel, ausgewählt vom Alphabet. Er hatte
   sie nie gewählt, und die App erklärte nirgends, woher sie kamen.

   Jetzt merkt sich der Hook nur noch das Profil. **Er legt keine Karte an und navigiert
   nirgendwohin**: `/heute` rendert von selbst weiter — vom Onboarding in den Guide, wo der
   Schüler seinen Karteikasten selbst zusammenstellt.
   ========================================================================= */

import { useCallback } from 'react';
import type { OnboardingResult } from '../components/features/onboarding/OnboardingFlow';
import { useProfileStore } from '../store/useProfileStore';

export function useCompleteOnboarding(): (result: OnboardingResult) => void {
  const setProfile = useProfileStore((s) => s.setProfile);

  return useCallback(
    ({ profession, examDate }: OnboardingResult) => {
      setProfile(profession, examDate);
    },
    [setProfile],
  );
}
