import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FlashcardsPage } from './FlashcardsPage'
import { useProgressStore } from '../store/useProgressStore'
import { useSessionStore } from '../store/useSessionStore'

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
    useProgressStore.getState().clearProgress()
    /* Der Sitzungs-Store lebt seit 7d außerhalb der Seite und übersteht ein Unmount —
       ohne dieses Aufräumen trägt eine Sitzung aus dem vorigen Test in den nächsten. */
    useSessionStore.getState().exit()
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

/* ── „Unsicher" darf nicht wie ein Fehler aussehen (UX-Review 2026-07-26) ──
   Gemessen am Build: 5 Karten, 12× „Unsicher" — die Anzeige stand die ganze Zeit auf
   „0/5". Zwölf Bewertungen, null sichtbarer Fortschritt und kein Wort dazu, dass die
   Karte nur zurückgestellt wurde. Diese Gruppe ist die Prüfzeile: Sie fällt, sobald die
   Zurückstellungen wieder unsichtbar sind. */
describe('„Unsicher" wird sichtbar zurückgestellt', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
    /* Der Sitzungs-Store lebt seit 7d außerhalb der Seite und übersteht ein Unmount —
       ohne dieses Aufräumen trägt eine Sitzung aus dem vorigen Test in den nächsten. */
    useSessionStore.getState().exit()
  })

  function starteMitZweiKarten() {
    useProgressStore.getState().addCards(['M. deltoideus', 'M. soleus'])
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/i }))
  }

  function bewerteUnsicher() {
    fireEvent.click(screen.getByRole('button', { name: /Karte aufdecken/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Unsicher' }))
  }

  it('zählt Zurückstellungen sichtbar mit, statt den Zähler stumm stehen zu lassen', () => {
    starteMitZweiKarten()
    expect(screen.getByLabelText('Fortschritt')).toHaveTextContent('0/2')
    expect(screen.getByLabelText('Fortschritt')).not.toHaveTextContent('zurückgestellt')

    bewerteUnsicher()
    expect(screen.getByLabelText('Fortschritt')).toHaveTextContent('1× zurückgestellt')

    bewerteUnsicher()
    expect(screen.getByLabelText('Fortschritt')).toHaveTextContent('2× zurückgestellt')

    // Der Erledigt-Zähler bleibt bei 0 — das ist richtig, die Karten sind nicht durch.
    expect(screen.getByLabelText('Fortschritt')).toHaveTextContent('0/2')
  })

  it('sagt auf der Karte, was „Unsicher" bewirkt', () => {
    starteMitZweiKarten()
    fireEvent.click(screen.getByRole('button', { name: /Karte aufdecken/i }))
    expect(screen.getByText(/legt die Karte zurück in diese Runde/i)).toBeInTheDocument()
  })

  it('die Zusammenfassung weist die Zurückstellungen aus', () => {
    starteMitZweiKarten()
    bewerteUnsicher() // Karte 1 nach hinten
    // Beide Karten erledigen, damit die Sitzung endet.
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Karte aufdecken/i }))
      fireEvent.click(screen.getByRole('button', { name: 'Richtig' }))
    }
    expect(screen.getByRole('heading', { name: /Sitzung geschafft/i })).toBeInTheDocument()
    expect(screen.getByText('zurückgestellt')).toBeInTheDocument()
  })
})

/* ── Bild groß auf der Lernkarte (Etappe 14a) ──
   Die Vollansicht kam zur Lernsitzung — und mit ihr drei Wege, die Karte HINTER dem
   offenen Bild zu bewerten: die Ziffern, die Leertaste und das Wischen. Das Quiz hatte
   seinen Tastenriegel schon, die Lernsitzung nicht. Jede der drei Prüfungen unten ist
   gegengetestet: Riegel entfernt ⇒ sie fällt. */
describe('Bild groß auf der Lernkarte', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().clearProgress()
    useSessionStore.getState().exit()
  })

  function starte(...namen: string[]) {
    useProgressStore.getState().addCards(namen)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/i }))
  }

  function oeffneVollansicht() {
    fireEvent.click(screen.getByRole('button', { name: 'Mit Bild anzeigen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bild groß anzeigen' }))
    return screen.getByRole('dialog')
  }

  const taste = (init: KeyboardEventInit) =>
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
    })

  it('ein Tipp auf das Bild öffnet die Vollansicht — mit Bildnachweis (CC BY 4.0)', () => {
    starte('M. deltoideus')
    const dialog = oeffneVollansicht()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByRole('img')).toHaveAttribute('alt', 'M. deltoideus — Ventral')
    expect(within(dialog).getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    )
  })

  it('Vollansicht offen: eine Ziffer bewertet die Karte dahinter NICHT — nach dem Schließen wieder', () => {
    starte('M. deltoideus')
    fireEvent.click(screen.getByRole('button', { name: /Karte aufdecken/i }))
    oeffneVollansicht()

    taste({ key: '3' })
    expect(useSessionStore.getState().reviewed).toBe(0)
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    taste({ key: '3' })
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(2)
  })

  it('Vollansicht offen: die Leertaste deckt die Karte NICHT auf', () => {
    starte('M. deltoideus')
    oeffneVollansicht()

    taste({ key: ' ', code: 'Space' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: /Karte bewerten/i })).not.toBeInTheDocument()
  })

  it('Wischen über das große Bild bewertet die Karte NICHT', () => {
    starte('M. deltoideus')
    fireEvent.click(screen.getByRole('button', { name: /Karte aufdecken/i }))
    const dialog = oeffneVollansicht()

    /* Die Vollansicht liegt per Portal im body, ihre Touch-Ereignisse erreichen aber den
       Sitzungs-Container (React-Baum, nicht DOM-Baum) — genau das macht den Riegel nötig. */
    const bild = within(dialog).getByRole('img')
    fireEvent.touchStart(bild, { touches: [{ clientX: 0 }] })
    fireEvent.touchEnd(bild, { changedTouches: [{ clientX: 200 }] })

    expect(useSessionStore.getState().reviewed).toBe(0)
  })

  it('Freitext-Stufe (Fach 7): weder das Bild noch die Vollansicht verraten den Namen', () => {
    useProgressStore.getState().addCards(['M. deltoideus'])
    useProgressStore.setState((s) => ({
      flashcards: {
        ...s.flashcards,
        cards: { ...s.flashcards.cards, 'M. deltoideus': { ...s.flashcards.cards['M. deltoideus'], fach: 7 } },
      },
    }))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Lernen starten/i }))
    expect(screen.getByRole('textbox', { name: /Lateinischer Name/i })).toBeInTheDocument()

    const dialog = oeffneVollansicht()
    expect(dialog.getAttribute('aria-label')).not.toMatch(/deltoideus/i)
    expect(dialog.textContent).not.toMatch(/deltoideus/i)
    for (const bild of screen.getAllByRole('img', { hidden: true })) {
      expect(bild.getAttribute('alt') ?? '').not.toMatch(/deltoideus/i)
    }
  })
})
