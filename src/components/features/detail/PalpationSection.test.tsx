import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PalpationSection } from './PalpationSection';

describe('PalpationSection', () => {
  it('zeigt nur die Felder, die gefüllt sind', () => {
    render(
      <PalpationSection
        palpation={{ position: 'Rückenlage', technique: 'Widerstand gegen Abduktion' }}
      />,
    );

    expect(screen.getByText('Lagerung')).toBeInTheDocument();
    expect(screen.getByText('Aufsuchen & Aktivieren')).toBeInTheDocument();
    // Ohne Inhalt keine Ueberschrift — sonst stuende ein leeres Label da.
    expect(screen.queryByText('Orientierungspunkte')).not.toBeInTheDocument();
    expect(screen.queryByText('Verwechslungsgefahr')).not.toBeInTheDocument();
  });

  it('zeigt einen bewussten PLATZHALTER, wenn kein Eintrag da ist', () => {
    /* Entscheidung des Projektinhabers (2026-07-13): Die Luecke soll absichtlich
       aussehen, nicht vergessen — dieselbe Haltung wie bei der Bildluecke aus 8f.
       Die Texte kommen aus dem Skript seiner Kollegen und werden von Hand eingetragen. */
    render(<PalpationSection />);
    expect(screen.getByText('Noch kein Palpationshinweis hinterlegt.')).toBeInTheDocument();
  });

  it('auch ein leerer Eintrag ergibt den Platzhalter, keine leere Sektion', () => {
    render(<PalpationSection palpation={{}} />);
    expect(screen.getByText('Noch kein Palpationshinweis hinterlegt.')).toBeInTheDocument();
  });

  it('ist eingeklappt und per Tastatur bedienbar (natives <details>)', () => {
    const { container } = render(<PalpationSection palpation={{ position: 'Rückenlage' }} />);

    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    // Die Zusammenfassung ist ein natives <summary> — fokussierbar ohne eigenes tabIndex.
    expect(container.querySelector('summary')).not.toBeNull();
    expect(screen.getByText('Am Körper finden')).toBeInTheDocument();
  });
});
