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

  it('Kasten leer (aber Profil vorhanden): führt zum Karteikasten statt in eine Sackgasse', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Karteikasten/i })).toBeInTheDocument()
    const cta = primaryAction()
    expect(cta).toHaveTextContent(/Muskeln auswählen/i)
    expect(cta).toHaveAttribute('href', '/karteikasten')
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
