import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

describe('App (Smoke)', () => {
  it('leitet die Wurzel auf den Heute-Screen um, nicht mehr auf die Suche (ADR 0007)', async () => {
    render(<App />)
    // Seiten werden lazy geladen (Etappe 5) — auf den aufgelösten Chunk warten.
    // Beim allerersten Start (kein Profil, kein Deck) ist das Onboarding der Vorschlag (7c).
    expect(
      await screen.findByRole('heading', { level: 1, name: /Was lernst du\?/i }),
    ).toBeInTheDocument()
  })

  it('zeigt die Hauptnavigation mit den vier Absichten', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: /Hauptnavigation/i })
    expect(nav).toBeInTheDocument()
    for (const label of ['Heute', 'Suche', 'Lernen', 'Fortschritt']) {
      expect(within(nav).getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
  })
})

/* ── Sprungmarke (UX-Review 2026-07-26) ──
   Gemessen lagen auf `/suche` sieben Tab-Stopps zwischen Seitenanfang und Inhalt — die
   Icon-Rail und die Kopfzeilen-Suche stehen auf JEDER Route, also zahlt eine
   Tastaturnutzerin sie jedes Mal neu. axe schweigt dazu (Landmarks erfüllen 2.4.1 formal),
   darum braucht es diese Zeile hier. */
describe('Zum Inhalt springen', () => {
  it('der erste Tab-Stopp der Seite ist die Sprungmarke — und sie zeigt auf den Inhalt', () => {
    const { container } = render(<App />)
    const skip = screen.getByRole('link', { name: /Zum Inhalt springen/i })

    // Erstes fokussierbares Element im DOM: nichts steht davor.
    const fokussierbar = container.querySelectorAll(
      'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
    )
    expect(fokussierbar[0]).toBe(skip)

    // Das Ziel existiert und kann den Fokus AUFNEHMEN (ohne tabIndex springt nur der
    // Bildlauf, der Fokus bleibt oben und die nächste Tab-Taste landet wieder in der Rail).
    expect(skip).toHaveAttribute('href', '#inhalt')
    const ziel = container.querySelector('#inhalt')
    expect(ziel).not.toBeNull()
    expect(ziel?.tagName).toBe('MAIN')
    expect(ziel).toHaveAttribute('tabindex', '-1')
  })
})
