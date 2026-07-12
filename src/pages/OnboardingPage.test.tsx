import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayPage } from './TodayPage'
import { OnboardingPage } from './OnboardingPage'
import { useProfileStore } from '../store/useProfileStore'
import { useProgressStore } from '../store/useProgressStore'
import { getMuscleByLatinName } from '../data'
import { SEED_DECK_SIZE } from '../data/seeding'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

function renderIn(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function deckNames(): string[] {
  return Object.keys(useProgressStore.getState().flashcards.cards)
}

describe('Onboarding — zwei Fragen, dann sofort lernen', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().resetProgress()
    useProfileStore.getState().resetProfile()
    navigate.mockClear()
  })

  it('Erststart: /heute fragt nach dem Beruf statt eine leere Liste zu zeigen', () => {
    renderIn(<TodayPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Was lernst du\?/i })).toBeInTheDocument()
    for (const label of ['Physiotherapie', 'Ergotherapie', 'Logopädie']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('Beruf wählen führt zur zweiten Frage — dem überspringbaren Prüfungstermin', () => {
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Logopädie/ }))

    expect(
      screen.getByRole('heading', { level: 1, name: /Wann ist deine Prüfung\?/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ohne Datum weiter/i })).toBeInTheDocument()
    // Genau ein Primärbutton (Rahmen-Invariante 2).
    expect(document.querySelectorAll('.btn--primary')).toHaveLength(1)
  })

  it('ohne Datum: Startdeck wird angelegt und die Sitzung startet sofort', () => {
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Logopädie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    const deck = deckNames()
    expect(deck).toHaveLength(SEED_DECK_SIZE)
    // Ein Logopädie-Startdeck beginnt am Kopf, nicht am Gesäß.
    expect(deck.filter((n) => getMuscleByLatinName(n)?.region === 'head').length).toBeGreaterThan(10)
    expect(deck).not.toContain('M. gluteus maximus')

    expect(useProfileStore.getState()).toMatchObject({ profession: 'logo', examDate: null })

    // Keine Bestätigungsseite — direkt in die Sitzung mit den frischen Karten.
    expect(navigate).toHaveBeenCalledTimes(1)
    const [path, options] = navigate.mock.calls[0]
    expect(path).toBe('/lernkarten')
    expect(options.state.start.names.length).toBeGreaterThan(0)
  })

  it('mit Prüfungstermin: das Datum wird gemerkt und hebt die Tagesdosis an', () => {
    const inFiveDays = new Date()
    inFiveDays.setDate(inFiveDays.getDate() + 5)
    const iso = inFiveDays.toISOString().slice(0, 10)

    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Physiotherapie/ }))
    fireEvent.change(screen.getByLabelText(/Prüfungstermin/i), { target: { value: iso } })
    fireEvent.click(screen.getByRole('button', { name: /Startdeck anlegen und loslegen/i }))

    expect(useProfileStore.getState().examDate).toBe(iso)
    // Dosis 40 statt 20 → das ganze Startdeck (20) kommt heute dran.
    expect(navigate.mock.calls[0][1].state.start.names).toHaveLength(SEED_DECK_SIZE)
  })

  it('wiederholbar über /start — auch wenn schon ein Profil existiert', () => {
    useProfileStore.getState().setProfile('physio', null)
    renderIn(<OnboardingPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Was lernst du\?/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ergotherapie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    expect(useProfileStore.getState().profession).toBe('ergo')
    expect(deckNames().length).toBeGreaterThan(0)
  })

  it('leerer Kasten MIT Profil zeigt den Leerzustand, nicht wieder das Onboarding', () => {
    useProfileStore.getState().setProfile('physio', null)
    renderIn(<TodayPage />)

    expect(screen.queryByRole('heading', { name: /Was lernst du\?/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Muskeln auswählen/i })).toBeInTheDocument()
  })
})
