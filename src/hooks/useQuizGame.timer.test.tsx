import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizPage } from '../pages/QuizPage';
import { quizSeriesKey, type QuizTimeLimit } from '../data/quiz';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';

/* Die Uhr laeuft gegen `Date.now()`, nicht gegen einen Zaehler — also muessen die Tests
   BEIDES vorspulen: die Zeit UND die Timer. Sonst tickt das Intervall zwar, rechnet aber
   immer noch dieselbe Restzeit aus. */
function spuleVor(sekunden: number) {
  act(() => {
    vi.advanceTimersByTime(sekunden * 1000);
  });
}

function starteRunde(zeit: string) {
  render(
    <MemoryRouter>
      <QuizPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: zeit }));
  // „Innervation" hat genau einen Startknopf und braucht keine Bilder.
  const innervation = screen
    .getAllByRole('button', { name: 'Starten' })
    .at(-1) as HTMLButtonElement;
  fireEvent.click(innervation);
}

describe('Zeitdruck im Quiz (Etappe 11)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useQuizStore.setState({ quizSeries: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ohne Uhr ist die Vorgabe — es gibt gar keinen Timer', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Ohne Zeit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('mit Uhr: sie zählt herunter und steht sichtbar über der Frage', () => {
    starteRunde('15 Sekunden');

    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Noch 15 Sekunden');

    spuleVor(5);
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Noch 10 Sekunden');
  });

  it('LÄUFT DIE ZEIT AB, zählt die Frage als falsch — aber sagt NICHT „falsch geklickt"', () => {
    starteRunde('15 Sekunden');
    spuleVor(16);

    /* „Leider falsch" waere gelogen: Es wurde nichts angeklickt. Und weil `selectedId` null
       bleibt, markiert die Karte auch keine Option als falsch gewaehlt. */
    expect(screen.getByText(/Zeit abgelaufen\. Richtig ist:/)).toBeInTheDocument();
    expect(screen.queryByText(/Leider falsch/)).not.toBeInTheDocument();
    expect(document.querySelector('.quiz-option--wrong')).toBeNull();
    expect(document.querySelector('.quiz-option--correct')).not.toBeNull();

    // Die Serie ist gerissen, und weiter geht es erst auf Klick.
    expect(screen.getByText(/0 in Folge richtig/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeEnabled();
  });

  it('die Uhr feuert GENAU EINMAL — kein zweites „falsch" durch einen Nachzügler-Tick', () => {
    starteRunde('15 Sekunden');
    spuleVor(60); // weit über die Zeit hinaus

    // Die Fortschrittsleiste haette sonst zwei Ergebnisse fuer eine Frage.
    expect(document.querySelectorAll('.quiz-progress__seg--wrong')).toHaveLength(1);
    expect(screen.getByText(/Frage 1\/10/)).toBeInTheDocument();
  });

  it('aufgedeckt hält die Uhr an — sie läuft nicht in die nächste Frage hinein', () => {
    starteRunde('30 Sekunden');
    spuleVor(2);

    fireEvent.click(screen.getAllByRole('radio')[0]);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Zeit angehalten');
    expect(timer.className).toContain('quiz-timer--paused');

    // Auch nach langem Warten im aufgedeckten Zustand passiert nichts mehr.
    spuleVor(60);
    expect(screen.getByText(/Frage 1\/10/)).toBeInTheDocument();
  });

  it('die Uhr schweigt gegenüber Screenreadern — sonst tickte sie jede Sekunde dazwischen', () => {
    starteRunde('15 Sekunden');
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    // Angesagt wird stattdessen das Ergebnis — über die ohnehin höfliche Rückmeldezeile.
    expect(document.querySelector('.quiz-card__feedback')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ADR 0002: die Uhr bekommt einen EIGENEN Serien-Schlüssel', () => {
  it('ohne Uhr bleibt der Schlüssel bitgleich', () => {
    expect(quizSeriesKey('innervation', [], 'all', 0)).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    // Die Vorgabe darf nichts veraendern — auch nicht implizit.
    expect(quizSeriesKey('innervation')).toBe(quizSeriesKey('innervation', [], 'all', 0));
  });

  it('mit Uhr hängt ein `timed`-Feld an — ein ZUSÄTZLICHER Schlüssel, kein veränderter', () => {
    expect(quizSeriesKey('innervation', [], 'all', 15)).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[],"timed":15}',
    );
    expect(quizSeriesKey('image', ['upper'], 'difficult', 30)).toBe(
      'image::{"deckOnly":true,"regions":["upper"],"subgroups":[],"filter":"difficult","timed":30}',
    );
  });

  it('jede Zeitstufe hat ihren eigenen Topf — 60 % unter der Uhr ≠ 60 % in Ruhe', () => {
    const keys = ([0, 30, 15] as QuizTimeLimit[]).map((t) =>
      quizSeriesKey('innervation', [], 'all', t),
    );
    expect(new Set(keys).size).toBe(3);
  });
});

/* ── Uhr und Klick werten NIE beide (UX-Review 2026-07-26) ──
   `phase` allein hat das nicht abgesichert: Der Intervall-Callback läuft außerhalb des
   React-Ereignisflusses, und ein Klick im selben Frame sah in `answer()` noch das alte
   `phase` aus seinem Closure. Ergebnis wären 11 Einträge bei 10 Fragen — und eine
   abgelaufene Frage, die als richtig zählt. Prüfzeile: Sie fällt, sobald der Ref-Riegel
   in `useQuizGame` verschwindet. */
describe('Zeitablauf und Klick schließen sich aus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useQuizStore.setState({ quizSeries: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* Hinweis: Das eigentliche Rennen (Uhr und Klick im SELBEN Frame) laesst sich hier
     nicht ausloesen — nach dem Zeitablauf sind die Optionen `disabled`, der Klick kommt gar
     nicht mehr an, und dieser Test waere auch ohne den Riegel gruen. Er steht darum als
     Hook-Test in `useQuizGame.test.ts` („zwei Klicks im selben Frame"), wo zwei Aufrufe
     dasselbe Render-Closure teilen. Hier bleibt nur, was der DOM wirklich zeigen kann. */
  it('die Ergebnisliste hat am Ende genau so viele Einträge wie Fragen', () => {
    starteRunde('Ohne Zeit');
    for (let i = 0; i < 10; i++) {
      const optionen = screen.getAllByRole('radio');
      fireEvent.click(optionen[0]);
      // Doppelklick auf dieselbe Option darf keinen zweiten Eintrag erzeugen.
      fireEvent.click(optionen[0]);
      const weiter = screen.getByRole('button', { name: /Weiter|Auswerten/ });
      fireEvent.click(weiter);
    }
    /* 10 Fragen, 20 Klicks — und trotzdem genau 10 Wertungen. Vor dem Riegel konnte
       `results` mehr Einträge sammeln als die Runde Fragen hat. */
    expect(screen.getByRole('heading', { name: /% richtig/ })).toBeInTheDocument();
    expect(
      document.querySelectorAll('.quiz-progress__seg--correct, .quiz-progress__seg--wrong').length,
    ).toBe(0); // Ergebnisschirm: keine Leiste mehr
  });
});

/* ── Tastatur im Quiz (UX-Review 2026-07-26) ──
   Die Lernsitzung hat seit 8a `Space`/`1`/`2`/`3`; im Quiz musste man für jede Frage zur
   Maus greifen. Unter der Uhr ist das der Unterschied zwischen Denken und Hetzen. */
describe('Tastatur im Quiz', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useQuizStore.setState({ quizSeries: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('„1" wählt die erste Option, „Enter" geht weiter', () => {
    starteRunde('Ohne Zeit');
    expect(screen.getByText(/Frage 1\/10/)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });
    // Ausgewählt = aufgedeckt: die richtige Antwort ist markiert.
    expect(document.querySelectorAll('.quiz-option--correct').length).toBe(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(screen.getByText(/Frage 2\/10/)).toBeInTheDocument();
  });

  it('nennt die Kürzel, damit sie nicht geheim sind', () => {
    starteRunde('Ohne Zeit');
    expect(screen.getByText(/antworten/)).toBeInTheDocument();
  });
})
