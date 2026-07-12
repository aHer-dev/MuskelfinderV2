/* =========================================================================
   TodayPage — der Einstieg (Etappe 7b, ADR 0007).

   Die App öffnet auf EINEM Vorschlag, nicht auf einem Katalog. Die Empfehlung
   selbst kommt getypt aus `data/today.ts`; hier entstehen nur die Sätze — und
   in jedem der vier Zustände genau ein Primärbutton.
   ========================================================================= */

import { Link, useNavigate } from 'react-router-dom';
import { regionLabel } from '../data/labels';
import type { TodayPlan } from '../data/today';
import { useTodayPlan } from '../hooks/useTodayPlan';
import { useProgressStore } from '../store/useProgressStore';
import { xpView } from '../persistence/xp';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProgressRing } from '../components/ui/ProgressRing';
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
    case 'needsOnboarding':
      parts.push('Noch keine Karten im Kasten');
      parts.push('Ohne Karten kann dich die App durch nichts durchführen');
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
  const totalXP = useProgressStore((s) => s.xp.totalXP);
  const xp = xpView(totalXP);

  const today = new Date().toLocaleDateString('de-DE', DATE_FORMAT);

  /** Sitzung mit einer bereits priorisierten Auswahl starten (Reihenfolge aus 7a). */
  const startSession = (names: string[]) => {
    navigate('/lernkarten', { state: { start: { names, limit: 0, scope: 'all' } } });
  };

  /** „Neue aus dem Pfad": erst in den Kasten, dann direkt lernen. */
  const learnSuggestions = () => {
    addCards(plan.newSuggestions);
    startSession(plan.newSuggestions);
  };

  return (
    <section className="page today">
      <header className="today__header">
        <p className="page__eyebrow">{today}</p>
        <h1 className="page__title">{headline(plan)}</h1>
      </header>

      {plan.kind === 'needsOnboarding' ? (
        <div className="today__hero">
          <EmptyState
            icon="icCards"
            title="Dein Karteikasten ist leer"
            description="Wähle die Muskeln aus, die du lernen willst — danach schlägt dir diese Seite jeden Tag genau eine Sitzung vor."
            action={
              <Link to="/karteikasten" className="btn btn--primary btn--block">
                Muskeln auswählen
              </Link>
            }
          />
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

      <Link to="/statistik" className="today__progress">
        <ProgressRing value={xp.progress} size={38} stroke={4} centerValue={String(xp.level)} />
        <span className="today__progress-text">
          Level {xp.level} · {plan.deckSize} {cardWord(plan.deckSize)} im Kasten
        </span>
        <Icon name="icArrow" size={16} />
      </Link>
    </section>
  );
}
