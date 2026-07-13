import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GuidePage } from './GuidePage';
import { FACH_INTERVALS, MAX_FACH } from '../persistence/leitner';

function renderPage() {
  return render(
    <MemoryRouter>
      <GuidePage />
    </MemoryRouter>,
  );
}

describe('GuidePage — die Anleitung (10b)', () => {
  it('zeigt genau so viele Fächer, wie es wirklich gibt — und die echten Abstände', () => {
    /* Die Tabelle darf keine erfundenen Zahlen zeigen: Wer die Intervalle in `leitner.ts`
       aendert, aendert damit die Anleitung mit. Sonst verspricht die Seite ein Wiedersehen,
       das der Algorithmus nie einhaelt. */
    renderPage();
    const tabelle = screen.getByRole('table');
    const zeilen = within(tabelle).getAllByRole('row').slice(1); // ohne Kopfzeile
    expect(zeilen).toHaveLength(MAX_FACH);

    // Fach 3 wartet laut Algorithmus 3 Tage — genau das muss dort stehen.
    expect(tabelle).toHaveTextContent(new RegExp(`${FACH_INTERVALS[3]} Tage`));
  });

  it('die waagerecht scrollende Fächer-Tabelle ist per Tastatur erreichbar (WCAG 2.1.1)', () => {
    /* `overflow-x: auto` + kein einziges fokussierbares Element in der Box: Ohne Tab-Stop
       kaeme man auf dem Handy nie an die dritte Spalte. axe meldete das als
       `scrollable-region-focusable`. */
    const { container } = renderPage();
    const box = container.querySelector('.guide__table-wrap')!;
    expect(box).toHaveAttribute('tabindex', '0');
    expect(box).toHaveAccessibleName(/Fächer-Tabelle/i);
  });

  it('die Tabellen-Region trägt NICHT denselben Namen wie ihr Abschnitt', () => {
    /* Erster Versuch war `aria-labelledby="guide-faecher"` — damit hiessen der `<section>`
       und die Scroll-Box beide „Die sieben Fächer". axe meldete `landmark-unique`: Ein
       Screenreader liest dieselbe Landmarke zweimal vor. Ein Verstoss gegen einen anderen
       getauscht ist keine Loesung. */
    const { container } = renderPage();
    const abschnitt = container.querySelector('[aria-labelledby="guide-faecher"]');
    const box = container.querySelector('.guide__table-wrap')!;
    expect(abschnitt).not.toBe(box);
    expect(box.getAttribute('aria-labelledby')).toBeNull();
  });
});
