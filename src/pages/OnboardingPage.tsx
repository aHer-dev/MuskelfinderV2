/* =========================================================================
   OnboardingPage (`/start`) — dieselben zwei Fragen, später noch einmal.
   src/pages/OnboardingPage.tsx

   Beim Erststart erscheint der Ablauf direkt auf `/heute` (dort IST er der
   Vorschlag) und die Seite rendert danach von selbst weiter — in den Guide.
   Diese Route existiert, damit das Profil später änderbar bleibt (verlinkt aus
   „Fortschritt"), und sie muss den Rückweg selbst gehen: Hier gibt es nichts,
   was nach dem Speichern noch neu rendern würde (ADR 0009).
   ========================================================================= */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow, type OnboardingResult } from '../components/features/onboarding/OnboardingFlow';
import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding';

export function OnboardingPage() {
  const complete = useCompleteOnboarding();
  const navigate = useNavigate();

  const done = useCallback(
    (result: OnboardingResult) => {
      complete(result);
      navigate('/heute');
    },
    [complete, navigate],
  );

  return (
    <section className="page">
      <p className="page__eyebrow">Lernprofil</p>
      <OnboardingFlow onDone={done} />
    </section>
  );
}
