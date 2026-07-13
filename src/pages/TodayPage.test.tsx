import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayPage } from './TodayPage'
import { useProfileStore } from '../store/useProfileStore'
import { useProgressStore } from '../store/useProgressStore'
import { getMuscles } from '../data'
import { dueDate } from '../persistence/leitner'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

const MUSCLES = getMuscles()

function renderPage() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  )
}

/** Karten anlegen und ihre Fälligkeit setzen — `inDays` in der Zukunft = nicht fällig. */
function seed(names: string[], { fach = 1, inDays = 0 }: { fach?: number; inDays?: number } = {}) {
  const store = useProgressStore.getState()
  store.addCards(names)
  const cards = { ...useProgressStore.getState().flashcards.cards }
  const anchor = new Date()
  anchor.setDate(anchor.getDate() + inDays)
  for (const name of names) {
    cards[name] = { ...cards[name], fach, nextDue: dueDate(1, anchor) }
  }
  useProgressStore.setState((s) => ({ flashcards: { ...s.flashcards, cards } }))
}

/** Der eine Primärbutton des Screens — Link oder Button. */
function primaryAction(): HTMLElement {
  const primaries = document.querySelectorAll('.btn--primary')
  expect(primaries).toHaveLength(1)
  return primaries[0] as HTMLElement
}

describe('TodayPage — jeder Zustand hat genau einen Primärbutton', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().resetProgress()
    // Das Profil ist gesetzt: der Erststart (Onboarding, 7c) ist hier durch —
    // getestet wird der Heute-Screen selbst.
    useProfileStore.getState().setProfile('physio', null)
    navigate.mockClear()
  })

  /* ADR 0009 ändert die Rahmen-Invariante 2 für GENAU DIESEN EINEN Zustand.
     Solange die App ein Startdeck von selbst anlegte, konnte der leere Kasten einen
     einzigen Vorschlag haben („Muskeln auswählen"). Jetzt IST das Wählen die Aufgabe —
     ein einzelner Primärbutton würde wieder für den Schüler entscheiden. Alle anderen
     Zustände behalten ihren einen Primärbutton; die Tests darunter prüfen das. */
  it('Kasten leer (aber Profil vorhanden): der Guide und drei Wege — statt EINER Vorgabe', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Karteikasten/i })).toBeInTheDocument()

    // Kein aufgedrängter Primärbutton: Hier entscheidet der Schüler, nicht die App.
    expect(document.querySelectorAll('.btn--primary')).toHaveLength(0)

    expect(screen.getByRole('link', { name: /So lernst du hier/i })).toHaveAttribute(
      'href',
      '/anleitung',
    )
    expect(screen.getByRole('heading', { name: /Nach Kursabschnitt/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Nach Bereich/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Einzeln aussuchen/i })).toBeInTheDocument()
  })

  it('… und solange keine Kursabschnitte hinterlegt sind, steht dort ein Platzhalter', () => {
    /* Die Abschnitte kommen vom Projektinhaber (docs/curriculum-erfassen.md).
       Ein leeres Menü wäre eine Sackgasse — der Platzhalter ist eine Zusage. */
    renderPage()

    expect(screen.getByText(/Noch keine Kursabschnitte hinterlegt/i)).toBeInTheDocument()
  })

  it('Normalfall: nennt die fällige Zahl und startet die Sitzung mit genau diesen Karten', () => {
    const names = MUSCLES.slice(0, 3).map((m) => m.nameLatin)
    seed(names, { inDays: -1 })

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Heute dran/i })).toBeInTheDocument()
    expect(screen.getByText(/3 Karten fällig/i)).toBeInTheDocument()

    fireEvent.click(primaryAction())

    expect(navigate).toHaveBeenCalledTimes(1)
    const [path, options] = navigate.mock.calls[0]
    expect(path).toBe('/lernkarten')
    expect(options.state.start.names).toHaveLength(3)
    expect(options.state.start.names.sort()).toEqual([...names].sort())
  })

  it('Überfällig-Stau: deckelt auf die Tagesdosis, nennt aber die volle Zahl', () => {
    const names = MUSCLES.slice(0, 60).map((m) => m.nameLatin)
    seed(names, { inDays: -3 })

    renderPage()

    expect(screen.getByText(/60 Karten fällig/i)).toBeInTheDocument()
    expect(screen.getByText(/heute 20 davon/i)).toBeInTheDocument()
    expect(primaryAction()).toHaveTextContent(/Los — 20 Karten lernen/i)

    fireEvent.click(primaryAction())
    expect(navigate.mock.calls[0][1].state.start.names).toHaveLength(20)
  })

  it('Nichts fällig: schlägt neue Muskeln vor, legt sie an und lernt sie sofort', () => {
    seed([MUSCLES[0].nameLatin], { fach: 4, inDays: 30 })

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Alles wiederholt/i })).toBeInTheDocument()
    expect(screen.getByText(/Nichts mehr fällig/i)).toBeInTheDocument()

    fireEvent.click(primaryAction())

    // Die Vorschläge landen im Kasten (5 neue + die eine bestehende Karte) …
    expect(Object.keys(useProgressStore.getState().flashcards.cards)).toHaveLength(6)
    // … und die Sitzung startet mit genau ihnen.
    expect(navigate.mock.calls[0][1].state.start.names).toHaveLength(5)
  })

  it('hält Quiz und Karteikasten als ruhige Sekundär-Aktionen erreichbar', () => {
    renderPage()
    const quick = screen.getByRole('heading', { name: /Schnell starten/i }).parentElement!

    expect(within(quick).getByRole('link', { name: /Quiz/i })).toHaveAttribute('href', '/quiz')
    expect(within(quick).getByRole('link', { name: /Karteikasten/i })).toHaveAttribute(
      'href',
      '/karteikasten',
    )
  })
})
