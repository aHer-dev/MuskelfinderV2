import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodayPage } from '../../../pages/TodayPage';
import { getGroupById } from '../../../data/groups';
import { MASTERED_FACH, newCard } from '../../../persistence/leitner';
import { useProfileStore } from '../../../store/useProfileStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { useStreakStore } from '../../../store/useStreakStore';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  );
}

/** Eine Gruppe mit genau einer fehlenden Karte — das „naechste Abzeichen". */
const MANSCHETTE = getGroupById('rotatorenmanschette')!.muscles;

function fastFertig() {
  act(() => {
    useProgressStore.getState().addCards([...MANSCHETTE]);
    useProgressStore.setState((s) => {
      const cards = { ...s.flashcards.cards };
      MANSCHETTE.forEach((name, i) => {
        cards[name] = { ...cards[name], fach: i === 0 ? 2 : MASTERED_FACH };
      });
      return { flashcards: { ...s.flashcards, cards } };
    });
  });
}

describe('StandRail — „Dein Stand" auf /heute (Etappe 12)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
    useProfileStore.getState().setProfile('physio', null);
    useStreakStore.getState().resetStreak();
    navigate.mockClear();
  });

  it('trägt die Marke NICHT mehr — die steht seit 12b in der Kopfzeile, auf jeder Seite', () => {
    /* Kurz stand sie hier: Damit hing das Logo an genau EINER Route (`/heute`), und auf dem
       Handy — wo es keine Rail gibt — nirgends. Jetzt haengt sie in der Shell. Stuende sie
       hier trotzdem noch, saehe man sie auf dieser Seite doppelt. */
    renderPage();
    const schiene = screen.getByRole('complementary', { name: 'Dein Stand' });
    expect(schiene).not.toHaveTextContent('Anatomie Fokus');
    expect(schiene.querySelector('img')).toBeNull();
  });

  it('zeigt Level und Karteikasten-Größe — bisher eine Textzeile am Seitenende', () => {
    act(() => {
      useProgressStore.getState().addCards(['M. deltoideus', 'M. soleus']);
    });
    renderPage();

    const schiene = screen.getByRole('complementary', { name: 'Dein Stand' });
    expect(schiene).toHaveTextContent(/Level 1/);
    expect(schiene).toHaveTextContent(/2 Karten im Kasten/);
  });

  it('OHNE Karten kein Abzeichen — man wäre jedem gleich fern', () => {
    /* „Das naechste Abzeichen" auf einem leeren Kasten waere eine willkuerliche Behauptung:
       Alle 14 Gruppen stuenden bei 0. */
    renderPage();
    expect(screen.queryByText(/Nächstes Abzeichen/i)).not.toBeInTheDocument();
  });

  it('MIT Karten nennt sie das Abzeichen, dem man am nächsten ist — und übt es', () => {
    fastFertig();
    renderPage();

    const schiene = screen.getByRole('complementary', { name: 'Dein Stand' });
    expect(schiene).toHaveTextContent(/Nächstes Abzeichen/i);
    expect(schiene).toHaveTextContent(/Rotatorenmanschette/i);
    expect(schiene).toHaveTextContent(
      new RegExp(`${MANSCHETTE.length - 1} von ${MANSCHETTE.length} beherrscht`),
    );

    fireEvent.click(screen.getByRole('button', { name: /Die fehlenden Karten üben/i }));

    // Die Sitzung startet mit GENAU der fehlenden Karte — nicht mit der ganzen Gruppe.
    expect(navigate).toHaveBeenCalledTimes(1);
    const [pfad, opts] = navigate.mock.calls[0];
    expect(pfad).toBe('/lernkarten');
    expect(opts.state.start.names).toEqual([MANSCHETTE[0]]);
  });

  it('der Prüfungstermin zählt herunter — sonst steht er nirgends', () => {
    const inZehnTagen = new Date();
    inZehnTagen.setDate(inZehnTagen.getDate() + 10);
    /* Das Datum LOKAL zusammensetzen, nicht ueber `toISOString()`: Das liefert UTC, und in
       den Stunden nach lokaler Mitternacht steht dort noch der Vortag — der Test zaehlte
       dann 9 statt 10 Tage und schlug je nach Uhrzeit fehl. Der Datumswaehler der App
       liefert ebenfalls ein lokales `yyyy-mm-dd`. */
    const lokal = [
      inZehnTagen.getFullYear(),
      String(inZehnTagen.getMonth() + 1).padStart(2, '0'),
      String(inZehnTagen.getDate()).padStart(2, '0'),
    ].join('-');
    useProfileStore.getState().setProfile('physio', lokal);

    act(() => {
      useProgressStore.getState().addCards(['M. deltoideus']);
    });
    renderPage();

    expect(screen.getByRole('complementary', { name: 'Dein Stand' })).toHaveTextContent(
      /Prüfung in\s*10\s*Tagen/,
    );
  });

  it('ohne Prüfungstermin steht dort auch nichts — keine leere Zeile', () => {
    act(() => {
      useProgressStore.getState().addCards(['M. deltoideus']);
    });
    renderPage();

    expect(screen.getByRole('complementary', { name: 'Dein Stand' })).not.toHaveTextContent(
      /Prüfung in/,
    );
  });

  it('eine frische Karte in der Gruppe wird ANGELEGT — sonst klebte das Abzeichen ewig', () => {
    /* Die Regel aus 9b: Ein Gruppenmuskel ohne Karte hat kein Fach. Kein Faelligkeitsfilter
       faende ihn — das Abzeichen bliebe fuer immer bei „3 von 4" stehen. */
    act(() => {
      const drin = MANSCHETTE.slice(1);
      useProgressStore.getState().addCards(drin);
      useProgressStore.setState((s) => {
        const cards = { ...s.flashcards.cards };
        for (const n of drin) cards[n] = { ...newCard(), fach: MASTERED_FACH };
        return { flashcards: { ...s.flashcards, cards } };
      });
    });
    renderPage();

    // Der fehlende Muskel liegt NICHT im Kasten …
    expect(useProgressStore.getState().flashcards.cards[MANSCHETTE[0]]).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: /Die fehlenden Karten üben/i }));

    // … danach schon.
    expect(useProgressStore.getState().flashcards.cards[MANSCHETTE[0]]).toBeDefined();
    expect(navigate.mock.calls[0][1].state.start.names).toContain(MANSCHETTE[0]);
  });
});
