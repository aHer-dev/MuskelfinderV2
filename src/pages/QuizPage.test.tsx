/* =========================================================================
   QuizPage — die Modus-Auswahl.
   src/pages/QuizPage.test.tsx

   Angelegt fuer die Namensfrage: Diese Seite war die vierte Stelle mit denselben
   Modusnamen und hatte KEINEN Test. Hier entscheidet sich, ob der Lernende
   dieselbe Uebung in Quiz, Statistik und Pruefung wiedererkennt.
   ========================================================================= */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizPage } from './QuizPage';
import { QUIZ_MODE_LABELS } from '../data/mode-labels';

function renderPage() {
  return render(<MemoryRouter initialEntries={['/quiz']}><QuizPage /></MemoryRouter>);
}

/** Beschriftungen aller Richtungsknöpfe, in DOM-Reihenfolge. */
function knopfBeschriftungen(): string[] {
  return Array.from(document.querySelectorAll('.quiz-dir-btn'))
    .map((el) => el.textContent?.trim() ?? '');
}

describe('QuizPage — Modus-Auswahl', () => {
  it('zeigt die Modus-Familien', () => {
    renderPage();
    for (const titel of ['Bildzuordnung', 'Ursprung & Ansatz', 'Funktions-Quiz', 'Innervation']) {
      expect(screen.getByText(titel), titel).toBeInTheDocument();
    }
  });

  it('beschriftet die konkreten Richtungen wie die eine Tabelle', () => {
    renderPage();
    const knoepfe = knopfBeschriftungen();
    for (const modus of ['image', 'name-image', 'origin-insertion', 'insertion-origin',
      'function-to-muscle', 'muscle-to-function'] as const) {
      expect(knoepfe, modus).toContain(QUIZ_MODE_LABELS[modus]);
    }
  });

  it('behält „Gemischt" und „Starten" als eigene Knopftexte', () => {
    /* Das ist Absicht, keine Lücke: Unter „Ursprung & Ansatz" ist „Gemischt"
       verständlich, „Ursprung ↔ Ansatz" wäre dort nur umständlich. Der Test hält
       fest, dass niemand das aus Einheitlichkeitsdrang „aufräumt". */
    renderPage();
    const knoepfe = knopfBeschriftungen();
    expect(knoepfe.filter((k) => k === 'Gemischt').length).toBe(3);
    expect(knoepfe).toContain('Starten');
    expect(knoepfe).not.toContain(QUIZ_MODE_LABELS['image-mixed']);
    expect(knoepfe).not.toContain(QUIZ_MODE_LABELS['origin-insertion-mixed']);
  });
});
