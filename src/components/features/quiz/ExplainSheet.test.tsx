/* =========================================================================
   ExplainSheet — die Vergleichskarte des Quiz.
   src/components/features/quiz/ExplainSheet.test.tsx

   Angelegt fuer die Reihenfolge-Frage: Diese Karte hatte als dritte Anzeige eine
   eigene Feldliste (Funktion vor Ursprung). Wer im Quiz danebenliegt, liest hier
   nach und gleich danach auf der Detailseite — standen die Felder verschieden,
   suchte er zweimal an der falschen Stelle.
   ========================================================================= */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExplainSheet } from './ExplainSheet';
import { getMuscles } from '../../../data';
import { folgtReihenfolge } from '../../../data/muscle-fields';
import type { Explanation } from '../../../data/explain';

const muskeln = getMuscles();
const correct = muskeln.find((m) => m.origin && m.insertion && m.functionDescription)!;
const chosen = muskeln.find((m) => m.id !== correct.id && m.origin)!;

const erklaerung = (over: Partial<Explanation> = {}): Explanation => ({
  text: 'Testsatz.', correct, chosen, aspect: 'origin', ...over,
} as Explanation);

/** Labels der ERSTEN Vergleichskarte, in DOM-Reihenfolge. */
function labelsDerKarte(): string[] {
  const karte = document.querySelector('.explain-card');
  return Array.from(karte?.querySelectorAll('dt') ?? []).map((el) => el.textContent ?? '');
}

describe('ExplainSheet', () => {
  it('zeigt beide Muskeln und den Erklärsatz', () => {
    render(<ExplainSheet open explanation={erklaerung()} onClose={() => {}} />);
    expect(screen.getByText('Testsatz.')).toBeInTheDocument();
    expect(screen.getByText(correct.nameLatin)).toBeInTheDocument();
    expect(screen.getByText(chosen.nameLatin)).toBeInTheDocument();
  });

  it('hält die kanonische Reihenfolge ein', () => {
    render(<ExplainSheet open explanation={erklaerung()} onClose={() => {}} />);
    const labels = labelsDerKarte();
    expect(folgtReihenfolge(labels), labels.join(' · ')).toBe(true);
  });

  it('zeigt Ursprung vor Funktion — vorher war es umgekehrt', () => {
    render(<ExplainSheet open explanation={erklaerung()} onClose={() => {}} />);
    const labels = labelsDerKarte();
    expect(labels.indexOf('Ursprung')).toBeLessThan(labels.indexOf('Funktion'));
  });

  it('hängt „Lage" hinten an und zeigt keine Segmente (kein Segment-Modus im Quiz)', () => {
    render(<ExplainSheet open explanation={erklaerung()} onClose={() => {}} />);
    const labels = labelsDerKarte();
    expect(labels).not.toContain('Segmente');
    expect(labels[labels.length - 1]).toBe('Lage');
  });

  it('hebt die gefragte Zeile hervor und nur die', () => {
    render(<ExplainSheet open explanation={erklaerung({ aspect: 'insertion' })} onClose={() => {}} />);
    const markiert = document.querySelectorAll('.explain-card:first-of-type .explain-row--asked');
    expect(markiert.length).toBe(1);
    expect(markiert[0].querySelector('dt')?.textContent).toBe('Ansatz');
  });

  it('behält die Reihenfolge für JEDEN Muskel des Bestands', () => {
    for (const m of muskeln) {
      const { unmount } = render(
        <ExplainSheet open explanation={erklaerung({ correct: m, chosen: undefined })} onClose={() => {}} />,
      );
      const labels = labelsDerKarte();
      expect(folgtReihenfolge(labels), `${m.nameLatin}: ${labels.join(' · ')}`).toBe(true);
      unmount();
    }
  });
});

/* Im Quiz steht die Kurzform (Etappe 15); der lange Text bleibt eingeklappt erreichbar. */
describe('ExplainSheet — Funktion in Kurzform', () => {
  it('zeigt die Kurzform ohne Stern — eine Marke ohne Legende waere ein Raetsel', () => {
    render(<ExplainSheet open explanation={erklaerung({ aspect: 'function' })} onClose={() => {}} />);
    const karte = document.querySelector('.explain-card')!;
    const zeile = Array.from(karte.querySelectorAll('.explain-row'))
      .find((r) => r.querySelector('dt')?.textContent?.startsWith('Funktion'))!;
    expect(zeile.querySelector('dt')?.textContent).toBe('Funktion');
    expect(zeile.querySelector('dd')?.textContent).not.toBe(correct.functionDescription);
  });

  it('der lange Text klappt je Karte auf', () => {
    render(<ExplainSheet open explanation={erklaerung({ aspect: 'function' })} onClose={() => {}} />);
    const karte = document.querySelector('.explain-card')!;
    expect(karte.querySelector('details summary')?.textContent).toBe('Funktionsbeschreibung');
    expect(karte.querySelector('details')?.textContent).toContain(correct.functionDescription);
  });
});
