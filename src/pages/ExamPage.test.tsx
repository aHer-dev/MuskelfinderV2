import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExamPage } from './ExamPage';
import { getMuscles } from '../data';
import { MIN_EXAM_CARDS } from '../data/exam';
import { useExamStore } from '../store/useExamStore';
import { useProgressStore } from '../store/useProgressStore';
import { newCard } from '../persistence/leitner';
import { createEmptyFlashcardsSection, createEmptyXpSection } from '../persistence/sanitize';
import type { FlashcardCard } from '../persistence/types';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const MUSCLES = getMuscles();

function seedDeck(count: number) {
  const cards: Record<string, FlashcardCard> = {};
  for (const muscle of MUSCLES.slice(0, count)) cards[muscle.nameLatin] = newCard();
  useProgressStore.setState({
    flashcards: { ...createEmptyFlashcardsSection(), cards },
    xp: createEmptyXpSection(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ExamPage />
    </MemoryRouter>,
  );
}

function startExam() {
  fireEvent.click(screen.getByRole('button', { name: /Prüfung starten/i }));
}

beforeEach(() => {
  navigate.mockClear();
  useExamStore.getState().reset();
  seedDeck(0);
});

describe('Einstieg', () => {
  it('blockt einen zu kleinen Kasten und zeigt den Weg, statt eine Prüfung anzubieten', () => {
    seedDeck(MIN_EXAM_CARDS - 1);
    renderPage();

    expect(screen.getByText(/Noch keine Prüfung möglich/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Karteikasten füllen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Prüfung starten/i })).not.toBeInTheDocument();
  });

  it('startet mit gefülltem Kasten', () => {
    seedDeck(20);
    renderPage();
    startExam();

    expect(screen.getByText(/Frage 1\/20/)).toBeInTheDocument();
    expect(screen.getByText(/Restzeit/)).toBeInTheDocument();
  });
});

describe('KEIN FEEDBACK VOR DEM ENDE', () => {
  /* Der Kern des Prüfungsmodus. Wer zwischendurch weiß, dass er falsch lag, prüft nicht
     mehr — er lernt. Das ist der Lernmodus, nicht die Prüfung. */

  it('eine beantwortete MC-Frage verrät nicht, ob sie richtig war', () => {
    seedDeck(20);
    renderPage();
    startExam();

    // Zur ersten MC-Frage blättern (das Set mischt Freitext und Multiple Choice).
    let optionen = screen.queryAllByRole('radio');
    let versuche = 0;
    while (optionen.length === 0 && versuche < 20) {
      fireEvent.click(screen.getByRole('button', { name: /^Weiter/ }));
      optionen = screen.queryAllByRole('radio');
      versuche++;
    }
    expect(optionen.length, 'keine MC-Frage im Set gefunden').toBeGreaterThan(0);

    fireEvent.click(optionen[0]);

    // Die Auswahl ist sichtbar …
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    // … das Urteil nicht.
    expect(screen.queryByText(/Richtig!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Leider falsch/)).not.toBeInTheDocument();
    for (const option of screen.getAllByRole('radio')) {
      expect(option.className).not.toMatch(/quiz-option--(correct|wrong)/);
      expect(option).not.toBeDisabled(); // die Antwort bleibt änderbar
    }
  });

  it('der Fortschritt zeigt „beantwortet", nicht „richtig"', () => {
    seedDeck(20);
    renderPage();
    startExam();

    expect(screen.getByRole('button', { name: 'Frage 1, offen' })).toBeInTheDocument();
  });
});

describe('Das Debrief — Brücke B3', () => {
  /**
   * Prüfung starten und jede Frage falsch beantworten. Die Antworten gehen direkt in den
   * Store (20 Fragen von Hand durchzuklicken prüft nichts) — darum `act`, sonst rendert
   * React die Auswertung nicht nach.
   */
  function examineAndFailEverything() {
    seedDeck(20);
    renderPage();
    startExam();

    const { items, answer, finish } = useExamStore.getState();
    act(() => {
      for (const item of items) {
        answer(
          item.id,
          item.kind === 'recall'
            ? 'völliger unsinn'
            : item.question.options.find((o) => o.id !== item.question.correctId)!.id,
        );
      }
      finish();
    });
    return items;
  }

  it('legt die verpassten Muskeln in den Kasten und startet SOFORT die Sitzung damit', () => {
    const items = examineAndFailEverything();

    const cta = screen.getByRole('button', { name: /Jetzt aus den Fehlern lernen/i });
    fireEvent.click(cta);

    const verpasst = [...new Set(items.map((i) => i.nameLatin))];

    // 1. Alle sind im Kasten und sofort fällig.
    const { cards } = useProgressStore.getState().flashcards;
    for (const name of verpasst) {
      expect(cards[name], `${name} fehlt im Kasten`).toBeDefined();
      expect(cards[name].totalWrong).toBeGreaterThan(0);
    }

    // 2. Die Sitzung startet mit GENAU diesen Karten.
    expect(navigate).toHaveBeenCalledWith('/lernkarten', {
      state: { start: { names: verpasst, limit: 0, scope: 'all' } },
    });
  });

  it('nennt die Lage schuldfrei — ein Befund, keine Note', () => {
    examineAndFailEverything();

    expect(screen.getByRole('heading', { name: /0 von 20 richtig/ })).toBeInTheDocument();
    expect(screen.getByText(/Hier lohnt sich deine Zeit/i)).toBeInTheDocument();
    expect(screen.queryByText(/durchgefallen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('KEIN CTA INS LEERE: ohne Fehler gibt es den Knopf nicht (Regel aus 8c)', () => {
    seedDeck(20);
    renderPage();
    startExam();

    const { items, answer, finish } = useExamStore.getState();
    act(() => {
      for (const item of items) {
        answer(item.id, item.kind === 'recall' ? item.nameLatin : item.question.correctId);
      }
      finish();
    });

    expect(screen.getByRole('heading', { name: /20 von 20 richtig/ })).toBeInTheDocument();
    expect(screen.getByText(/Nichts verpasst/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Jetzt aus den Fehlern lernen/i }),
    ).not.toBeInTheDocument();
  });

  it('gliedert nach Region und Abrufform', () => {
    examineAndFailEverything();

    expect(screen.getByRole('heading', { name: 'Nach Region' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nach Abrufform' })).toBeInTheDocument();
  });
});

/* ── Eine Prüfung stirbt nicht an einem Klick daneben (UX-Review 2026-07-26) ──
   Bis dahin räumte ein `useEffect`-Cleanup die Prüfung beim Unmount weg. Seit 7d sitzt
   das Suchfeld in der Kopfzeile JEDER Route — gemessen: „biceps" ins Suchfeld, Enter,
   zurück, und 20 Antworten waren weg, ohne Warnung. Diese Gruppe ist die Prüfzeile:
   Sie fällt, sobald das Aufräumen im Unmount zurückkommt. */
describe('Die laufende Prüfung übersteht die Navigation', () => {
  it('ein Seitenwechsel (Unmount) beendet die Prüfung NICHT', () => {
    seedDeck(20);
    const view = renderPage();
    startExam();

    const item = useExamStore.getState().items[0];
    act(() => {
      useExamStore.getState().answer(item.id, item.kind === 'recall' ? 'etwas' : 'irgendwas');
    });
    expect(useExamStore.getState().phase).toBe('running');

    // Wer in der Kopfzeile etwas nachschlägt, verlässt die Route: die Seite wird unmountet.
    view.unmount();

    expect(useExamStore.getState().phase).toBe('running');
    expect(Object.keys(useExamStore.getState().answers)).toHaveLength(1);

    // Und beim Zurückkommen läuft sie weiter, statt den Startknopf zu zeigen.
    renderPage();
    expect(screen.queryByRole('button', { name: /Prüfung starten/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prüfung verwerfen/i })).toBeInTheDocument();
  });

  it('„Prüfung verwerfen" wirft sie weg — aber nur nach Rückfrage', () => {
    seedDeck(20);
    renderPage();
    startExam();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: /Prüfung verwerfen/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(useExamStore.getState().phase).toBe('running'); // abgelehnt = nichts passiert

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Prüfung verwerfen/i }));
    expect(useExamStore.getState().phase).toBe('idle');
    confirmSpy.mockRestore();
  });

  it('das Debrief hat einen ausdrücklichen Schluss zurück zum Einstieg', () => {
    seedDeck(20);
    renderPage();
    startExam();
    act(() => useExamStore.getState().finish());

    fireEvent.click(screen.getByRole('button', { name: /Auswertung schließen/i }));
    expect(useExamStore.getState().phase).toBe('idle');
    expect(screen.getByRole('button', { name: /Prüfung starten/i })).toBeInTheDocument();
  });
});
