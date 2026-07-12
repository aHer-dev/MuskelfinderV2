/* =========================================================================
   useCompleteOnboarding — was nach der zweiten Frage passiert (Etappe 7c).
   src/hooks/useCompleteOnboarding.ts

   Profil merken, Startdeck anlegen, und **direkt in die erste Sitzung** — keine
   Bestätigungsseite dazwischen. Der Tagesplan (7a) entscheidet dabei, wie viele
   der frischen Karten heute drankommen; das Startdeck ist bereits auf eine
   Tagesdosis geschnitten, ein naher Prüfungstermin darf sie aber anheben.
   ========================================================================= */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayPlan } from '../data/today';
import type { OnboardingResult } from '../components/features/onboarding/OnboardingFlow';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';

export function useCompleteOnboarding(): (result: OnboardingResult) => void {
  const navigate = useNavigate();
  const setProfile = useProfileStore((s) => s.setProfile);
  const addCards = useProgressStore((s) => s.addCards);

  return useCallback(
    ({ profession, examDate, deck }: OnboardingResult) => {
      setProfile(profession, examDate);
      addCards(deck);

      const { flashcards } = useProgressStore.getState();
      const plan = getTodayPlan({ cards: flashcards.cards, examDate });

      navigate('/lernkarten', {
        state: { start: { names: plan.dueCards, limit: 0, scope: 'all' } },
      });
    },
    [addCards, navigate, setProfile],
  );
}
