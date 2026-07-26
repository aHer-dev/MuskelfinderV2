import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
