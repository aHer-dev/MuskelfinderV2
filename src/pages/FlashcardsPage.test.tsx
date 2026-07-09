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

  it('leerer Kasten → Hinweis auf Karteikasten-Verwaltung', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Muskeln verwalten/i })).toBeInTheDocument()
  })

  it('gefüllter Kasten → Setup mit Fällig-Zähler + „Lernen starten"', () => {
    useProgressStore.getState().addCards(['M. deltoideus', 'M. soleus'])
    renderPage()
    expect(screen.getByText(/heute fällig/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lernen starten/i })).toBeInTheDocument()
  })

  it('„Lernen starten" wechselt in den Card-Screen', () => {
    useProgressStore.getState().addCards(['M. deltoideus'])
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/i }))
    // Card-Screen: Bewertungsleiste ist vorhanden.
    expect(screen.getByRole('group', { name: /Karte bewerten/i })).toBeInTheDocument()
  })
})
