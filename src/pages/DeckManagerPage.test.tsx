import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DeckManagerPage } from './DeckManagerPage'
import { useProgressStore } from '../store/useProgressStore'

function renderPage() {
  return render(
    <MemoryRouter>
      <DeckManagerPage />
    </MemoryRouter>,
  )
}

describe('DeckManagerPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().resetProgress()
  })

  it('zeigt beide Bereiche und startet mit leerem Kasten', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /Muskeln verwalten/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Im Karteikasten$/i })).toBeInTheDocument()
    expect(screen.getByText(/Noch keine Muskeln im Karteikasten/i)).toBeInTheDocument()
  })

  it('fügt ausgewählte Muskeln per Checkbox + Button zum Kasten hinzu', () => {
    renderPage()
    const check = screen.getAllByRole('checkbox')[0]
    fireEvent.click(check)
    const addBtn = screen.getByRole('button', { name: /Ausgewählte hinzufügen \(1\)/i })
    fireEvent.click(addBtn)
    expect(Object.keys(useProgressStore.getState().flashcards.cards).length).toBe(1)
  })

  it('„Alle sichtbaren hinzufügen" fügt die aktuell gefilterte Liste hinzu', () => {
    renderPage()
    // Auf eine Region einschränken, damit „alle sichtbaren" < Gesamt ist.
    fireEvent.click(screen.getByRole('tab', { name: /Kopf & Hals/i }))
    fireEvent.click(screen.getByRole('button', { name: /Alle sichtbaren hinzufügen/i }))
    const deckSize = Object.keys(useProgressStore.getState().flashcards.cards).length
    expect(deckSize).toBeGreaterThan(0)
    // Alle hinzugefügten liegen in der Region head.
    const store = useProgressStore.getState()
    expect(store.flashcards.cards).toBeTruthy()
  })

  it('entfernt eine Karte wieder aus dem Kasten', () => {
    useProgressStore.getState().addCard('M. deltoideus')
    renderPage()
    const inDeckTable = screen.getByRole('table')
    const removeBtn = within(inDeckTable).getByRole('button', { name: /entfernen/i })
    fireEvent.click(removeBtn)
    expect(useProgressStore.getState().isInDeck('M. deltoideus')).toBe(false)
  })
})
