import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (Smoke)', () => {
  it('rendert und leitet die Wurzel auf die Suche um', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^Muskulatur$/i }),
    ).toBeInTheDocument()
  })

  it('zeigt die Hauptnavigation mit allen Routen', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: /Hauptnavigation/i })
    expect(nav).toBeInTheDocument()
    for (const label of ['Suche', 'Lernkarten', 'Quiz', 'Statistik']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
  })
})
