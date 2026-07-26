import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DeckManagerPage } from './DeckManagerPage'
import { useProgressStore } from '../store/useProgressStore'
import { CARD_MUSCLES } from '../data'
import { CARD_KEY_MARK } from '../data/card-key'

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
   56 Zeilen. Die Tabelle lief ueber die 150 Muskeln statt ueber die Karten, und `M. nasalis`
   steht dort zweimal (Pars transversa und Pars alaris). Wer eine der beiden Zeilen entfernte,
   loeschte die andere gleich mit: Es ist derselbe Schluessel. */
describe('zwei Funktionszeilen ergeben EINE Zeile', () => {
  const EIN_MUSKEL = 'M. nasalis' // zweimal im Bestand, EIN Muskel

  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
  })

  it('zeigt eine Karte als genau eine Zeile — nicht als zwei', () => {
    useProgressStore.getState().addCards([EIN_MUSKEL])
    renderPage()

    const zeilen = within(screen.getByRole('table'))
      .getAllByRole('row')
      .filter((row) => within(row).queryByText(EIN_MUSKEL))

    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(1)
    expect(zeilen).toHaveLength(1)
  })

  it('entfernt die Karte, ohne eine zweite Zeile stehen zu lassen', () => {
    useProgressStore.getState().addCards([EIN_MUSKEL])
    renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(`${EIN_MUSKEL} aus Karteikasten`) }),
    )

    expect(useProgressStore.getState().flashcards.cards).toEqual({})
    expect(screen.getByRole('heading', { name: /Noch keine Karten/i })).toBeInTheDocument()
  })

  it('bietet ihn in der Auswahlliste nur einmal an', () => {
    renderPage()
    // Beide Zeilen legten dieselbe Karte an — die zweite war ein Klick ins Leere.
    expect(screen.getAllByText(EIN_MUSKEL)).toHaveLength(1)
  })
})

/* ── Hand und Fuss sind ZWEI Karten mit demselben Namen (ADR 0012) ──────────────
   Die Gegenrichtung der Gruppe darueber. Bis zum 2026-07-26 loesten beide Namen auf den
   FUSS auf: Der Handmuskel war ueber Karten gar nicht lernbar, und wer ihn im Kasten
   glaubte, lernte Kleinzehen-Fakten. Jetzt stehen beide da — und muessen unterscheidbar
   sein, sonst ist der Kasten wieder genau so verwirrend wie vor der Entdopplung. */
describe('gleicher Name, zwei Karten — und trotzdem unterscheidbar', () => {
  const NAME = 'M. abductor digiti minimi'
  const HAND = `${NAME}${CARD_KEY_MARK}manus`

  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
  })

  it('legt zwei getrennte Karten an — eine Hand, eine Fuss', () => {
    useProgressStore.getState().addCards([HAND, NAME])
    renderPage()

    const zeilen = within(screen.getByRole('table'))
      .getAllByRole('row')
      .filter((row) => within(row).queryByText(NAME))

    expect(zeilen).toHaveLength(2)
    expect(zeilen.map((r) => within(r).getByRole('cell', { name: /Extremität/ }).textContent))
      .toEqual(expect.arrayContaining(['Obere Extremität', 'Untere Extremität']))
  })

  it('KEINE zwei Knoepfe mit demselben zugaenglichen Namen', () => {
    /* Die Tabelle trennt die beiden ueber die Spalte „Bereich" — der Entfernen-Knopf hat
       aber nur seinen eigenen Namen. Zwei Knoepfe „M. abductor digiti minimi aus
       Karteikasten entfernen" untereinander sind fuer eine Screenreader-Nutzerin nicht
       auseinanderzuhalten, und `getByRole` faende sie ebenfalls nicht (dieser Test faellt
       dann mit „found multiple elements"). */
    useProgressStore.getState().addCards([HAND, NAME])
    renderPage()

    const namen = screen
      .getAllByRole('button', { name: /aus Karteikasten entfernen/ })
      .map((b) => b.getAttribute('aria-label'))

    expect(new Set(namen).size).toBe(namen.length)
    expect(namen).toEqual(
      expect.arrayContaining([
        `${NAME} (Hand & Finger) aus Karteikasten entfernen`,
        `${NAME} (Fuß & Sprunggelenk) aus Karteikasten entfernen`,
      ]),
    )
  })

  it('„Entfernen" nimmt genau eine der beiden mit', () => {
    /* Vor der Entdopplung war es derselbe Schluessel: Ein Klick loeschte beide. */
    useProgressStore.getState().addCards([HAND, NAME])
    renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: `${NAME} (Hand & Finger) aus Karteikasten entfernen` }),
    )

    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toEqual([NAME])
  })

  it('bietet beide in der Auswahlliste an — mit ihrer Subregion daneben', () => {
    renderPage()
    const eintraege = screen.getAllByText(NAME)

    expect(eintraege).toHaveLength(2)
    const beschriftungen = eintraege.map((el) => el.closest('label')?.textContent)
    expect(beschriftungen).toEqual(
      expect.arrayContaining([
        `${NAME}Hand & Finger`,
        `${NAME}Fuß & Sprunggelenk`,
      ]),
    )
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
    const offen = CARD_MUSCLES.length - Object.keys(useProgressStore.getState().flashcards.cards).length
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
