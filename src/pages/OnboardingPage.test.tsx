import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayPage } from './TodayPage'
import { OnboardingPage } from './OnboardingPage'
import { useProfileStore } from '../store/useProfileStore'
import { useProgressStore } from '../store/useProgressStore'

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

describe('Onboarding — zwei Fragen, dann WÄHLT DER SCHÜLER (ADR 0009)', () => {
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

  it('DAS ONBOARDING LEGT KEINE EINZIGE KARTE AN — der Kern von ADR 0009', () => {
    /* Bis zum 2026-07-13 standen hier 20 Karten und eine laufende Sitzung. Die erste
       Karte, die ein Physio-Schueler je sah, war `M. abductor digiti minimi` — ein
       Fussmuskel, ausgewaehlt vom Alphabet, den er nie gewaehlt hatte. */
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Logopädie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    expect(deckNames()).toEqual([])
    expect(useProfileStore.getState()).toMatchObject({ profession: 'logo', examDate: null })
    // Und ganz besonders: KEIN Sprung in eine Sitzung.
    expect(navigate).not.toHaveBeenCalled()
  })

  it('stattdessen steht danach der Guide da — mit den drei Wegen in den Karteikasten', () => {
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Physiotherapie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    expect(screen.getByRole('link', { name: /So lernst du hier/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Nach Kursabschnitt/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Nach Bereich/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Einzeln aussuchen/i })).toBeInTheDocument()
  })

  /* Solange `curriculum.json` leer ist, ist „Nach Kursabschnitt" ein Platzhalter — und der
     stand als ERSTE und groesste Karte da. Die allererste Wahl einer Schuelerin fuehrte damit
     ins Leere, waehrend der Weg, der traegt (Bereich), unter der Falz lag. Der Platzhalter
     bleibt (ADR 0009), aber er steht hinten, bis es Abschnitte gibt. */
  it('ohne Kursabschnitte steht der benutzbare Weg VOR dem Platzhalter', () => {
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Physiotherapie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    const wege = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent?.trim())
      .filter((t) => t && /Kursabschnitt|Bereich|Einzeln/.test(t))

    expect(wege).toEqual(['Nach Bereich', 'Nach Kursabschnitt', 'Einzeln aussuchen'])
    // Der Platzhalter ist NICHT verschwunden — er erklaert weiter, was hier einmal steht.
    expect(screen.getByText(/Noch keine Kursabschnitte hinterlegt/i)).toBeInTheDocument()
  })

  it('erst der Klick des Schülers füllt den Kasten — und zwar mit dem, was draufsteht', () => {
    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Physiotherapie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))
    expect(deckNames()).toEqual([])

    // „Kopf" ist der kleinste Bereich — die Zahl am Knopf ist die Zahl der Karten.
    const kopf = screen.getByRole('button', { name: /Kopf/ })
    const versprochen = Number(kopf.textContent?.match(/(\d+)\s*$/)?.[1])
    expect(versprochen).toBeGreaterThan(0)

    fireEvent.click(kopf)
    expect(deckNames()).toHaveLength(versprochen)
  })

  it('mit Prüfungstermin: das Datum wird gemerkt — ohne dass Karten entstehen', () => {
    const inFiveDays = new Date()
    inFiveDays.setDate(inFiveDays.getDate() + 5)
    const iso = inFiveDays.toISOString().slice(0, 10)

    renderIn(<TodayPage />)
    fireEvent.click(screen.getByRole('button', { name: /Physiotherapie/ }))
    fireEvent.change(screen.getByLabelText(/Prüfungstermin/i), { target: { value: iso } })
    fireEvent.click(screen.getByRole('button', { name: /^Weiter$/ }))

    expect(useProfileStore.getState().examDate).toBe(iso)
    expect(deckNames()).toEqual([])
  })

  it('über /start änderbar — und führt danach zurück nach /heute, nicht ins Nichts', () => {
    useProfileStore.getState().setProfile('physio', null)
    renderIn(<OnboardingPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Was lernst du\?/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ergotherapie/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ohne Datum weiter/i }))

    expect(useProfileStore.getState().profession).toBe('ergo')
    expect(deckNames()).toEqual([])
    expect(navigate).toHaveBeenCalledWith('/heute')
  })
})

describe('Kein Codepfad legt Karten ohne Zutun des Nutzers an (ADR 0009)', () => {
  /* Ein Regressionstest am Quelltext: Ein wiederauferstandenes Seeding-Modul wuerde still
     Karten anlegen, und die Verhaltenstests oben pruefen nur den Weg ueber das Onboarding.
     Nicht auf `seedDeck` als Wort pruefen — mehrere Testdateien haben eine gleichnamige
     lokale Fixture-Hilfe, und die ist voellig in Ordnung. */
  const SRC = resolve(__dirname, '..')

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) return sourceFiles(full)
      return /\.tsx?$/.test(entry.name) ? [full] : []
    })
  }

  it('das Seeding-Modul ist gelöscht — nicht auskommentiert, nicht ungenutzt: weg', () => {
    expect(existsSync(join(SRC, 'data/seeding.ts'))).toBe(false)
  })

  it('niemand importiert es mehr, und `SEED_DECK_SIZE` existiert nirgends', () => {
    const treffer = sourceFiles(SRC).filter((file) => {
      if (file.endsWith('OnboardingPage.test.tsx')) return false // diese Datei benennt es ja
      const code = readFileSync(file, 'utf8')
      return /from\s+['"][^'"]*data\/seeding['"]/.test(code) || /\bSEED_DECK_SIZE\b/.test(code)
    })

    expect(treffer.map((f) => relative(SRC, f))).toEqual([])
  })
})
