/* =========================================================================
   OnboardingPage (`/start`) — dieselben zwei Fragen, später noch einmal.
   src/pages/OnboardingPage.tsx

   Beim Erststart erscheint der Ablauf direkt auf `/heute` (dort IST er der
   Vorschlag). Diese Route existiert, damit das Profil danach änderbar bleibt —
   verlinkt aus „Fortschritt".
   ========================================================================= */

import { OnboardingFlow } from '../components/features/onboarding/OnboardingFlow';
import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding';

export function OnboardingPage() {
  const complete = useCompleteOnboarding();

  return (
    <section className="page">
      <p className="page__eyebrow">Lernprofil</p>
      <OnboardingFlow onDone={complete} />
    </section>
  );
}
