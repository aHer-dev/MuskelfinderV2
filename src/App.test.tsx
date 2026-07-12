import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

describe('App (Smoke)', () => {
  it('leitet die Wurzel auf den Heute-Screen um, nicht mehr auf die Suche (ADR 0007)', async () => {
    render(<App />)
    // Seiten werden lazy geladen (Etappe 5) — auf den aufgelösten Chunk warten.
    // Ohne Karten begrüßt „Heute" mit dem Erstsetup-Vorschlag.
    expect(
      await screen.findByRole('heading', { level: 1, name: /Fang mit deinem Karteikasten an/i }),
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
