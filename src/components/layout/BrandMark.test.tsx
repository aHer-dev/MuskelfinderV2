import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

/* Die Shell umschliesst JEDE Route (App.tsx). Was hier drin steht, steht deshalb auf jeder
   Seite — und genau das ist die Zusage, die diese Datei bewacht. */
function renderShell(route = '/heute') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppShell>
        <h1>Irgendeine Seite</h1>
      </AppShell>
    </MemoryRouter>,
  );
}

/** Der Test-Stub meldet „nichts matcht" → mobil. Fuer die Rail brauchen wir Desktop. */
const echtesMatchMedia = window.matchMedia;
function alsDesktop() {
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

const ROUTEN = ['/heute', '/suche', '/lernkarten', '/karteikasten', '/quiz', '/statistik', '/anleitung'];

describe('BrandMark — die Marke steht auf jeder Seite (Etappe 12b)', () => {
  afterEach(() => {
    window.matchMedia = echtesMatchMedia;
  });

  it.each(ROUTEN)('%s trägt das Logo mit Namen', (route) => {
    renderShell(route);

    const marke = screen.getByRole('link', { name: /Anatomie Fokus/i });
    expect(marke).toHaveTextContent('Anatomie Fokus');
    expect(marke).toHaveTextContent('Muskelfinder');
  });

  it('„Anatomie Fokus" steht OBEN, „Muskelfinder" darunter — nicht umgekehrt', () => {
    renderShell();
    const text = screen.getByRole('link', { name: /Anatomie Fokus/i }).textContent ?? '';
    expect(text.indexOf('Anatomie Fokus')).toBeLessThan(text.indexOf('Muskelfinder'));
  });

  it('führt nach Hause — ein Logo, das nirgendwohin führt, ist eine Enttäuschung', () => {
    renderShell('/statistik');
    expect(screen.getByRole('link', { name: /Anatomie Fokus/i })).toHaveAttribute('href', '/heute');
  });

  it('das Zeichen wird nicht gestaucht — die echten Maße stehen im Markup', () => {
    /* Die Datei ist 985 × 892. Die Rail zwang sie in 30 × 30 und drueckte den Keil um 10 %
       zusammen. Stehen die Originalmasse im Markup, kennt der Browser das Verhaeltnis —
       das CSS setzt nur noch die Hoehe. */
    const { container } = renderShell();
    const img = container.querySelector<HTMLImageElement>('.brand-mark img')!;
    expect(img.getAttribute('width')).toBe('985');
    expect(img.getAttribute('height')).toBe('892');
  });

  it('auf dem Desktop steht das Zeichen GENAU EINMAL — die Rail trägt es nicht mehr', () => {
    /* Zweimal dasselbe Logo auf einem Bildschirm (links in der Rail, rechts in der Kopfzeile)
       waere kein Branding, sondern ein Versehen. */
    alsDesktop();
    const { container } = renderShell();

    expect(container.querySelectorAll('img[src*="af-logo"]')).toHaveLength(1);

    const rail = screen.getByRole('navigation', { name: /Hauptnavigation/i });
    expect(rail.querySelector('img')).toBeNull();
  });

  it('der Weg nach Hause fehlt der Rail trotzdem nicht — „Heute" ist der erste Nav-Punkt', () => {
    alsDesktop();
    renderShell();
    const rail = screen.getByRole('navigation', { name: /Hauptnavigation/i });
    const ersterLink = rail.querySelector('a');
    expect(ersterLink).toHaveAttribute('href', '/heute');
  });
});
