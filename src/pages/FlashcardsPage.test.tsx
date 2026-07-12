import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FlashcardsPage } from './FlashcardsPage'
import { useProgressStore } from '../store/useProgressStore'

function renderPage() {
  return render(
    <MemoryRouter>
      <FlashcardsPage />
    </MemoryRouter>,
  )
}

describe('FlashcardsPage — 3-Screen-Ablauf', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().resetProgress()
  })

  it('leerer Kasten → Leerzustand mit CTA in die Karteikasten-Verwaltung', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Karteikasten ist leer/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Muskeln hinzufügen/i })).toHaveAttribute(
      'href',
      '/karteikasten',
    )
  })

  it('gefüllter Kasten → Setup mit Fällig-Zähler + „Lernen starten"', () => {
    useProgressStore.getState().addCards(['M. deltoideus', 'M. soleus'])
    renderPage()
    expect(screen.getByText(/heute fällig/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lernen starten/i })).toBeInTheDocument()
  })

  it('„Lernen starten" zeigt zuerst „Karte aufdecken", Bewertung erst nach dem Aufdecken', () => {
    useProgressStore.getState().addCards(['M. deltoideus'])
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/i }))

    // Vor dem Aufdecken: KEINE Bewertungs-Buttons (kein „toter" Disabled-Klick), stattdessen Aufdecken.
    expect(screen.queryByRole('button', { name: 'Richtig' })).not.toBeInTheDocument()
    const reveal = screen.getByRole('button', { name: /Karte aufdecken/i })
    expect(reveal).toBeInTheDocument()

    // Nach dem Aufdecken: Bewertungsleiste da und klickbar.
    fireEvent.click(reveal)
    expect(screen.getByRole('group', { name: /Karte bewerten/i })).toBeInTheDocument()
    const richtig = screen.getByRole('button', { name: 'Richtig' })
    expect(richtig).toBeEnabled()

    // Bewertung verschiebt das Fach (Sitzung reagiert).
    fireEvent.click(richtig)
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(2)
  })
})
