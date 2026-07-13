import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatsPage } from './StatsPage';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { quizSeriesKey } from '../data/quiz';
import type { FlashcardCard } from '../persistence/types';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const DAY = 86_400_000;

function card(fach: number, dueInDays = -1): FlashcardCard {
  return {
    fach,
    nextDue: new Date(Date.now() + dueInDays * DAY).toISOString(),
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}

function seedDeck(cards: Record<string, FlashcardCard>) {
  useProgressStore.setState((s) => ({ flashcards: { ...s.flashcards, cards } }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StatsPage />
    </MemoryRouter>,
  );
}

/** Die Blöcke, die eine Schwäche ausweisen — jeder braucht eine Aktion (Brücke B4). */
const WEAKNESS_PANELS = [
  'Lernkarten',
  'Beherrschung nach Region',
  'Quiz-Bilanz je Modus',
  'Ziele',
  'Kompetenz-Abzeichen',
];

function panelOf(heading: string): HTMLElement {
  const title = screen.getByRole('heading', { name: heading, level: 2 });
  const panel = title.closest('section');
  if (!panel) throw new Error(`Kein Panel zu „${heading}"`);
  return panel;
}

beforeEach(() => {
  navigate.mockClear();
  useProgressStore.setState((s) => ({
    flashcards: { ...s.flashcards, cards: {} },
    xp: { ...s.xp, totalXP: 0 },
  }));
  useQuizStore.setState({ quizSeries: {} });
});

describe('Keine Zahl ohne Knopf (Brücke B4)', () => {
  it('kein Schwäche-Block bleibt ohne Aktion — auch nicht mit leerem Kasten', () => {
    renderPage();
    for (const heading of WEAKNESS_PANELS) {
      // Knopf oder Link — beides ist eine Aktion. Nur „gar nichts" ist verboten.
      const buttons = within(panelOf(heading)).queryAllByRole('button');
      const links = within(panelOf(heading)).queryAllByRole('link');
      expect(buttons.length + links.length, `„${heading}" hat keinen Knopf`).toBeGreaterThan(0);
    }
  });

  it('deaktivierte Knöpfe nennen den Grund — sie schweigen nicht', () => {
    renderPage(); // leerer Kasten: nichts zu üben
    const region = within(panelOf('Beherrschung nach Region'));
    expect(region.getByRole('button')).toBeDisabled();
    expect(region.getByText('Dazu liegt keine Karte im Kasten')).toBeInTheDocument();
  });
});

describe('Ein CTA startet die Sitzung, die er verspricht', () => {
  it('„Region üben" übergibt genau die fälligen Karten der schwächsten Region', () => {
    seedDeck({
      'M. psoas minor': card(1),
      'M. psoas major': card(6, 10),
      'M. pectoralis minor': card(7),
      'M. serratus anterior': card(6),
    });
    renderPage();

    const region = within(panelOf('Beherrschung nach Region'));
    region.getByRole('button', { name: /Untere Extremität üben/ }).click();

    expect(navigate).toHaveBeenCalledWith('/lernkarten', {
      state: { start: { names: ['M. psoas minor'], limit: 0, scope: 'all' } },
    });
  });

  it('„schwächster Modus üben" springt in genau diesen Quizmodus', () => {
    useQuizStore.setState({
      quizSeries: {
        [quizSeriesKey('innervation')]: { rounds: 2, answers: 20, correct: 4, history: [] },
        [quizSeriesKey('image')]: { rounds: 2, answers: 20, correct: 18, history: [] },
      },
    });
    renderPage();

    const quiz = within(panelOf('Quiz-Bilanz je Modus'));
    quiz.getByRole('button', { name: /Innervation üben/ }).click();

    expect(navigate).toHaveBeenCalledWith('/quiz', { state: { mode: 'innervation' } });
  });

  it('der Meilenstein-Knopf bietet so viele Karten, wie der Satz darüber nennt', () => {
    /* 4 gemeistert → nächster Meilenstein ist 5, es fehlt GENAU EINE Karte.
       Der Knopf darf nicht die Meilenstein-Zahl (5) als Menge missverstehen. */
    seedDeck({
      'M. pectoralis minor': card(5),
      'M. serratus anterior': card(6),
      'M. subclavius': card(7),
      'M. trapezius – Pars descendens': card(5),
      'M. psoas minor': card(4),
      'M. iliacus': card(3),
      'M. masseter': card(2),
    });
    renderPage();

    const panel = panelOf('Ziele');
    const goals = within(panel);
    expect(goals.getByText(/bis zum Meilenstein/).textContent).toMatch(/Noch\s*1\s*Karte/);
    // Die Menge am Knopf muss dieselbe sein wie im Satz darueber.
    expect(panel.querySelector('.stats__cta-note')?.textContent).toBe('1 Karte');

    goals.getByRole('button', { name: 'Die Karten kurz vor dem Ziel üben' }).click();
    const [, options] = navigate.mock.calls[0];
    expect(options.state.start.names).toEqual(['M. psoas minor']); // Fach 4 — die naechste an der Linie
  });

  it('der Knopf verspricht genau so viele Karten, wie er startet', () => {
    seedDeck({
      'M. pectoralis minor': card(1),
      'M. serratus anterior': card(2),
      'M. subclavius': card(4, 9), // nicht fällig
    });
    renderPage();

    const deckPanel = within(panelOf('Lernkarten'));
    expect(deckPanel.getByText('2 Karten')).toBeInTheDocument();

    deckPanel.getByRole('button', { name: 'Die schwachen Karten üben' }).click();
    const [, options] = navigate.mock.calls[0];
    expect(options.state.start.names).toHaveLength(2);
  });
});

describe('Kompetenz-Abzeichen (9b)', () => {
  /* Die Rotatorenmanschette aus 9a — vier Muskeln, ein Abzeichen. */
  const MANSCHETTE = [
    'M. supraspinatus',
    'M. infraspinatus',
    'M. teres minor',
    'M. subscapularis',
  ];

  function badgeRow(label: string): HTMLElement {
    const link = screen.getByRole('link', { name: label });
    const row = link.closest('li');
    if (!row) throw new Error(`Keine Abzeichen-Zeile zu „${label}"`);
    return row;
  }

  it('zeigt den Weg, nicht nur den Pokal', () => {
    seedDeck(Object.fromEntries(MANSCHETTE.map((n, i) => [n, card(i === 0 ? 4 : 5)])));
    renderPage();

    expect(within(badgeRow('Rotatorenmanschette')).getByText('3 von 4')).toBeInTheDocument();
  });

  it('„verdient" steht als WORT da, nicht nur als Farbe', () => {
    seedDeck(Object.fromEntries(MANSCHETTE.map((n) => [n, card(6)])));
    renderPage();

    expect(within(badgeRow('Rotatorenmanschette')).getByText('verdient')).toBeInTheDocument();
    // Verdient heißt: nichts mehr zu üben — also auch kein Knopf.
    expect(within(badgeRow('Rotatorenmanschette')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('FÄLLT EINE KARTE ZURÜCK, IST DAS ABZEICHEN WIEDER WEG', () => {
    seedDeck(Object.fromEntries(MANSCHETTE.map((n) => [n, card(6)])));
    const { rerender } = renderPage();
    expect(within(badgeRow('Rotatorenmanschette')).getByText('verdient')).toBeInTheDocument();

    // Eine Karte rutscht zurueck — es gibt keinen gespeicherten Rest, der das ueberlebt.
    seedDeck(Object.fromEntries(MANSCHETTE.map((n, i) => [n, card(i === 0 ? 4 : 6)])));
    rerender(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>,
    );

    expect(within(badgeRow('Rotatorenmanschette')).queryByText('verdient')).not.toBeInTheDocument();
    expect(within(badgeRow('Rotatorenmanschette')).getByText('3 von 4')).toBeInTheDocument();
  });

  it('der Knopf startet eine Sitzung mit GENAU den fehlenden, fälligen Karten', () => {
    seedDeck({
      'M. supraspinatus': card(4), // offen + faellig
      'M. infraspinatus': card(6), // gemeistert
      'M. teres minor': card(5), // gemeistert
      'M. subscapularis': card(6, 30), // gemeistert, nicht faellig
    });
    renderPage();

    within(badgeRow('Rotatorenmanschette'))
      .getByRole('button', { name: 'Die fehlende Karte üben' })
      .click();

    expect(navigate).toHaveBeenCalledWith('/lernkarten', {
      state: { start: { names: ['M. supraspinatus'], limit: 0, scope: 'all' } },
    });
  });

  it('NIMMT EINEN MUSKEL MIT, DER NICHT IM KASTEN LIEGT — sonst bliebe das Abzeichen ewig offen', () => {
    /* Ein Gruppenmuskel ohne Karte hat kein Fach; kein Fälligkeitsfilter findet ihn.
       Der Knopf legt ihn an (frische Karte = sofort fällig) und übt ihn. */
    seedDeck({
      'M. supraspinatus': card(6),
      'M. infraspinatus': card(6),
      'M. teres minor': card(6),
      // M. subscapularis fehlt komplett
    });
    renderPage();

    within(badgeRow('Rotatorenmanschette'))
      .getByRole('button', { name: 'Die fehlende Karte üben' })
      .click();

    expect(useProgressStore.getState().flashcards.cards['M. subscapularis']).toBeDefined();
    expect(navigate).toHaveBeenCalledWith('/lernkarten', {
      state: { start: { names: ['M. subscapularis'], limit: 0, scope: 'all' } },
    });
  });

  it('ist nichts fällig, ist der Knopf deaktiviert — MIT Begründung', () => {
    seedDeck({
      'M. supraspinatus': card(4, 30), // offen, aber erst in 30 Tagen dran
      'M. infraspinatus': card(6),
      'M. teres minor': card(6),
      'M. subscapularis': card(6),
    });
    renderPage();

    const row = within(badgeRow('Rotatorenmanschette'));
    expect(row.getByRole('button')).toBeDisabled();
    expect(row.getByText('Heute nichts fällig — schon erledigt')).toBeInTheDocument();
  });
});
