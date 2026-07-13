/* =========================================================================
   TodayPage — der Einstieg (Etappe 7b, ADR 0007).

   Die App öffnet auf EINEM Vorschlag, nicht auf einem Katalog. Die Empfehlung
   selbst kommt getypt aus `data/today.ts`; hier entstehen nur die Sätze — und
   in jedem der vier Zustände genau ein Primärbutton.
   ========================================================================= */

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMuscleByLatinName } from '../data';
import { regionLabel } from '../data/labels';
import { lookupSuggestions } from '../data/lookups';
import type { TodayPlan } from '../data/today';
import { useTodayPlan } from '../hooks/useTodayPlan';
import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding';
import { useLookupStore } from '../store/useLookupStore';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';
import { StandRail } from '../components/features/today/StandRail';
import { DeckStarter } from '../components/features/onboarding/DeckStarter';
import { OnboardingFlow } from '../components/features/onboarding/OnboardingFlow';
import { Icon } from '../components/ui/Icon';
import './today.css';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };

function cardWord(n: number): string {
  return n === 1 ? 'Karte' : 'Karten';
}

function muscleWord(n: number): string {
  return n === 1 ? 'Muskel' : 'Muskeln';
}

/** Überschrift je Zustand. Keine Schuld-Botschaft, kein Jubel — nur die Lage. */
function headline(plan: TodayPlan): string {
  switch (plan.kind) {
    case 'needsOnboarding':
      return 'Fang mit deinem Karteikasten an';
    case 'new':
      return 'Alles wiederholt';
    case 'backlog':
      return 'Wir holen den Stau in Etappen auf';
    case 'review':
      return 'Heute dran';
  }
}

/**
 * Die Diagnosezeile als Segmente („12 Karten fällig · 8 davon Schulter — deine
 * schwächste Region · ca. 5 Min"). Die Zahlen liefert der Plan, die Worte hier.
 */
function diagnosis(plan: TodayPlan): string[] {
  const parts: string[] = [];
  const focus =
    plan.focusRegion && plan.focusRegionCount > 0
      ? `${plan.focusRegionCount} davon ${regionLabel(plan.focusRegion)} — deine schwächste Region`
      : null;

  switch (plan.kind) {
    /* Seit ADR 0009 rendert `/heute` für den leeren Kasten den Guide und den DeckStarter,
       nicht diese Aufzählung — der Fall kommt hier nicht mehr an. `TodayPlan` ist ein
       flaches Interface (keine diskriminierte Union), also verlangt der Switch die Marke
       trotzdem. Leere Liste statt eines Satzes, der nirgends steht. */
    case 'needsOnboarding':
      return parts;

    case 'new':
      parts.push('Nichts mehr fällig');
      parts.push(`${plan.newSuggestions.length} neue ${muscleWord(plan.newSuggestions.length)} aus deinem Pfad`);
      if (focus) parts.push(focus);
      parts.push(`ca. ${plan.estimatedMinutes} Min`);
      return parts;

    case 'backlog':
      parts.push(`${plan.dueTotal} ${cardWord(plan.dueTotal)} fällig`);
      parts.push(`heute ${plan.dueCards.length} davon`);
      if (focus) parts.push(focus);
      parts.push(`ca. ${plan.estimatedMinutes} Min`);
      return parts;

    case 'review':
      parts.push(`${plan.dueTotal} ${cardWord(plan.dueTotal)} fällig`);
      if (focus) parts.push(focus);
      parts.push(`ca. ${plan.estimatedMinutes} Min`);
      return parts;
  }
}

export function TodayPage() {
  const plan = useTodayPlan();
  const navigate = useNavigate();
  const addCards = useProgressStore((s) => s.addCards);
  const cards = useProgressStore((s) => s.flashcards.cards);
  const profession = useProfileStore((s) => s.profession);
  const lookups = useLookupStore((s) => s.lookups);
  const forgetLookups = useLookupStore((s) => s.forget);
  const completeOnboarding = useCompleteOnboarding();

  // Brücke B1: nachgeschlagen = noch nicht gewusst. Was im Kasten liegt, ist keine Lücke.
  const gaps = useMemo(() => lookupSuggestions({ lookups, cards }), [lookups, cards]);

  const today = new Date().toLocaleDateString('de-DE', DATE_FORMAT);

  /* Erststart (7c): leerer Kasten UND noch kein Profil. Dann ist das Onboarding der
     Vorschlag — es füllt den Kasten und führt direkt in die erste Sitzung. Wer den
     Kasten später leert, hat ein Profil und bekommt den Leerzustand darunter. */
  if (plan.kind === 'needsOnboarding' && profession === null) {
    return (
      <section className="page today">
        <OnboardingFlow onDone={completeOnboarding} />
      </section>
    );
  }

  /** Sitzung mit einer bereits priorisierten Auswahl starten (Reihenfolge aus 7a). */
  const startSession = (names: string[]) => {
    navigate('/lernkarten', { state: { start: { names, limit: 0, scope: 'all' } } });
  };

  /** „Neue aus dem Pfad": erst in den Kasten, dann direkt lernen. */
  const learnSuggestions = () => {
    addCards(plan.newSuggestions);
    startSession(plan.newSuggestions);
  };

  /** Die nachgeschlagenen Lücken in den Kasten holen — ohne die Verwaltungsseite zu öffnen. */
  const learnGaps = () => {
    const names = gaps.map((g) => g.name);
    addCards(names);
    forgetLookups(names);
  };

  /* Dieselbe Handlung wie in der Statistik (9b): Ein Gruppenmuskel ohne Karte hat kein Fach —
     ohne `addCards` bliebe das Abzeichen ewig bei „3 von 4" stehen. */
  const practiceBadge = (names: string[]) => {
    addCards(names);
    startSession(names);
  };

  return (
    /* Zwei Spalten ab 1200px (siehe today.css): links der eine Vorschlag, rechts „Dein Stand".
       Darunter stapelt es — die Schiene rutscht unter den Inhalt. */
    <section className="page today-layout">
      <div className="today">
        <header className="today__header">
          <p className="page__eyebrow">{today}</p>
          <h1 className="page__title">{headline(plan)}</h1>
        </header>

        {plan.kind === 'needsOnboarding' ? (
          /* Leerer Kasten heisst ab ADR 0009 nicht mehr „kaputt", sondern „du bist dran".
             Statt eines Leerzustands mit einem Knopf steht hier, WIE hier gelernt wird —
             und die drei Wege, den Kasten zu fuellen. */
          <div className="today__start">
            <p className="today__start-lead">
              Dein Karteikasten ist leer — und das ist der richtige Anfang. Du entscheidest, was du
              lernst; die App legt dir nichts ungefragt hinein. Danach schlägt dir diese Seite jeden
              Tag genau eine Sitzung vor: das, was heute fällig ist, nicht alles auf einmal.
            </p>
            <Link to="/anleitung" className="today__start-guide">
              <Icon name="icQuiz" size={16} />
              <span>So lernst du hier — die Anleitung in zwei Minuten</span>
              <Icon name="icArrow" size={16} />
            </Link>

            <h2 className="today__subtitle">Womit fängst du an?</h2>
            <DeckStarter />
          </div>
        ) : (
          <div className="today__hero">
            <ul className="today__diagnosis">
              {diagnosis(plan).map((part) => (
                <li key={part}>{part}</li>
              ))}
            </ul>

            {plan.kind === 'new' ? (
              <button type="button" className="btn btn--primary btn--block" onClick={learnSuggestions}>
                {plan.newSuggestions.length} neue {muscleWord(plan.newSuggestions.length)} lernen
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => startSession(plan.dueCards)}
              >
                Los — {plan.dueCards.length} {cardWord(plan.dueCards.length)} lernen
              </button>
            )}

            {plan.kind === 'backlog' && (
              <p className="today__note">
                Der Rest bleibt liegen und wartet. Eine Sitzung am Stück ist mehr wert als eine, die
                du abbrichst.
              </p>
            )}
          </div>
        )}

        {gaps.length > 0 && (
          <section className="today__gaps" aria-labelledby="today-gaps">
            <h2 className="today__subtitle" id="today-gaps">
              Zuletzt nachgeschlagen <span className="today__gaps-note">= noch nicht gewusst</span>
            </h2>

            <ul className="today__gap-list">
              {gaps.map((gap) => {
                const muscle = getMuscleByLatinName(gap.name);
                return (
                  <li key={gap.name} className="today__gap">
                    <Link to={muscle ? `/muskel/${muscle.id}` : '/suche'} className="today__gap-name">
                      {gap.name}
                    </Link>
                    <span className="today__gap-count">
                      {gap.count}× nachgeschlagen
                      {muscle ? ` · ${regionLabel(muscle.region)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>

            <button type="button" className="btn btn--ghost" onClick={learnGaps}>
              {gaps.length === 1
                ? 'Als Karte lernen'
                : `Alle ${gaps.length} als Karten lernen`}
            </button>
          </section>
        )}

        {/* Die Fortschrittszeile (Level · Serie · Freezes) stand bis Etappe 12 HIER — als
            Textzeile ganz unten am Seitenende, waehrend rechts 444 px brach lagen (gemessen bei
            1440 px). Sie ist in die `StandRail` gewandert.

            „Schnell starten" bleibt dagegen HIER. Es kurz mit in die Schiene zu raeumen war ein
            Fehler: Die linke Spalte brach dann nach dem einen Knopf ab und liess unten ein Loch —
            und Navigation hat links schon eine Heimat (die Icon-Rail). Die Schiene sagt, WO man
            steht; sie fuehrt nicht. */}
        <section className="today__quick" aria-labelledby="today-quick">
          <h2 className="today__subtitle" id="today-quick">
            Schnell starten
          </h2>
          <div className="today__quick-links">
            <Link to="/quiz" className="today__quick-link">
              <Icon name="icQuiz" size={18} />
              <span>Quiz</span>
              <Icon name="icArrow" size={16} />
            </Link>
            <Link to="/karteikasten" className="today__quick-link">
              <Icon name="icList" size={18} />
              <span>Karteikasten</span>
              <Icon name="icArrow" size={16} />
            </Link>
            <Link to="/suche" className="today__quick-link">
              <Icon name="icSearch" size={18} />
              <span>Nachschlagen</span>
              <Icon name="icArrow" size={16} />
            </Link>
          </div>
        </section>
      </div>

      <StandRail plan={plan} onPractice={practiceBadge} />
    </section>
  );
}
