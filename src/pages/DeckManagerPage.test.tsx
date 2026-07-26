import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    useProgressStore.getState().clearProgress()
  })

  it('zeigt beide Bereiche und startet mit leerem Kasten', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /Muskeln verwalten/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Im Karteikasten$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Noch keine Karten/i })).toBeInTheDocument()
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
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    // Auf eine Region einschränken, damit „alle sichtbaren" < Gesamt ist.
    fireEvent.click(screen.getByRole('tab', { name: /Kopf & Hals/i }))
    fireEvent.click(screen.getByRole('button', { name: /Alle \d+ sichtbaren hinzufügen/i }))
    const deckSize = Object.keys(useProgressStore.getState().flashcards.cards).length
    expect(deckSize).toBeGreaterThan(0)
    confirmSpy.mockRestore()
  })

  it('entfernt eine Karte wieder aus dem Kasten', () => {
    useProgressStore.getState().addCard('M. deltoideus')
    renderPage()
    const inDeckTable = screen.getByRole('table')
    const removeBtn = within(inDeckTable).getByRole('button', { name: /entfernen/i })
    fireEvent.click(removeBtn)
    expect(useProgressStore.getState().isInDeck('M. deltoideus')).toBe(false)
  })

  it('die waagerecht scrollende Tabelle ist per Tastatur erreichbar (WCAG 2.1.1)', () => {
    /* Die Box hat `overflow-x: auto` — auf dem Handy scrollt sie immer. Ohne Tab-Stop kaeme
       eine Tastaturnutzerin nie an die rechte Spalte. axe meldete das als
       `scrollable-region-focusable`. */
    useProgressStore.getState().addCard('M. deltoideus')
    const { container } = renderPage()
    const box = container.querySelector('.deck-table-wrap')!
    expect(box).toHaveAttribute('tabindex', '0')
    expect(box).toHaveAccessibleName(/Karten in deinem Kasten/i)
  })
})

/* Gemessen am Build (2026-07-13): Wer „Obere Extremitaet" waehlte, bekam 53 Karten — und sah
   56 Zeilen. Drei `nameLatin` gibt es zweimal (Hand/Fuss), und die Tabelle lief ueber die
   150 Muskeln statt ueber die Karten. Wer die Fuss-Zeile entfernte, loeschte die Handkarte
   gleich mit: Es ist derselbe Schluessel. */
describe('doppelte Muskelnamen ergeben EINE Zeile', () => {
  const ZWILLING = 'M. abductor digiti minimi' // Hand UND Fuss

  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
  })

  it('zeigt eine Karte als genau eine Zeile — nicht als zwei', () => {
    useProgressStore.getState().addCards([ZWILLING])
    renderPage()

    const zeilen = within(screen.getByRole('table'))
      .getAllByRole('row')
      .filter((row) => within(row).queryByText(ZWILLING))

    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(1)
    expect(zeilen).toHaveLength(1)
  })

  it('entfernt die Karte, ohne eine zweite Zeile stehen zu lassen', () => {
    useProgressStore.getState().addCards([ZWILLING])
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${ZWILLING} aus Karteikasten`) }))

    expect(useProgressStore.getState().flashcards.cards).toEqual({})
    expect(screen.getByRole('heading', { name: /Noch keine Karten/i })).toBeInTheDocument()
  })

  it('bietet den Zwilling in der Auswahlliste nur einmal an', () => {
    renderPage()
    // Vor der Entdopplung standen Hand UND Fuss hier — beide legten dieselbe Karte an.
    expect(screen.getAllByText(ZWILLING)).toHaveLength(1)
  })
})

/* ── Das Massen-Hinzufügen ist keine Einbahnstraße mehr (UX-Review 2026-07-26) ──
   Gemessen am Build: Ein Klick auf „Alle sichtbaren hinzufügen" legte 121 Karten an —
   ohne Zahl am Knopf, ohne Rückfrage, und der einzige Rückweg waren 145 einzelne
   „Entfernen"-Klicks. Diese Gruppe ist die Prüfzeile für alle drei Hälften. */
describe('Massen-Hinzufügen: Zahl, Rückfrage, Rückweg', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
  })

  it('die Zahl steht am Knopf — man sieht, wie viel man auslöst', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /Alle \d+ sichtbaren hinzufügen/i })
    const offen = 145 - Object.keys(useProgressStore.getState().flashcards.cards).length
    expect(btn).toHaveAccessibleName(new RegExp(`Alle ${offen} sichtbaren hinzufügen`))
  })

  it('fragt vor einem grossen Stapel nach — und legt bei „Abbrechen" NICHTS an', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Alle \d+ sichtbaren hinzufügen/i }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(0)
    confirmSpy.mockRestore()
  })

  it('ein kleiner Stapel braucht keine Rückfrage', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    // Die Suche auf einen sehr engen Treffer einschränken (< 20 Karten).
    fireEvent.change(screen.getByRole('searchbox', { name: /Muskel im Zugang suchen/i }), {
      target: { value: 'biceps' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Alle \d+ sichtbaren hinzufügen/i }))
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(Object.keys(useProgressStore.getState().flashcards.cards).length).toBeGreaterThan(0)
    confirmSpy.mockRestore()
  })

  it('„Alle N entfernen" ist der Rückweg — nach Rückfrage, in EINEM Schritt', () => {
    useProgressStore.getState().addCards(['M. deltoideus', 'M. soleus', 'M. biceps brachii'])
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()

    const btn = screen.getByRole('button', { name: /Alle 3 entfernen/i })
    fireEvent.click(btn)
    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(3) // abgelehnt

    confirmSpy.mockReturnValue(true)
    fireEvent.click(btn)
    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(0)
    confirmSpy.mockRestore()
  })

  it('ohne Karten gibt es keinen „Alle entfernen"-Knopf', () => {
    renderPage()
    expect(screen.queryByRole('button', { name: /Alle \d+ entfernen/i })).not.toBeInTheDocument()
  })
})
