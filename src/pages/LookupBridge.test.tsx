import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MuscleDetailPage } from './MuscleDetailPage'
import { TodayPage } from './TodayPage'
import { useLookupStore } from '../store/useLookupStore'
import { useProfileStore } from '../store/useProfileStore'
import { useProgressStore } from '../store/useProgressStore'
import { getMuscles } from '../data'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const MUSCLE = getMuscles()[0]

/** Die Detailseite unter ihrer echten Route rendern (sie liest `:id` aus dem Pfad). */
function visitDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/muskel/${id}`]}>
      <Routes>
        <Route path="/muskel/:id" element={<MuscleDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderToday() {
  return render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  )
}

describe('Brücke B1 — Nachschlagen füllt den Karteikasten', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.getState().resetProgress()
    useLookupStore.getState().resetLookups()
    useProfileStore.getState().setProfile('physio', null)
  })

  it('ein Detailaufruf wird gezählt — mehrfaches Nachschlagen summiert sich', () => {
    visitDetail(MUSCLE.id).unmount()
    visitDetail(MUSCLE.id).unmount()
    visitDetail(MUSCLE.id).unmount()

    expect(useLookupStore.getState().lookups.entries[MUSCLE.nameLatin].count).toBe(3)
  })

  it('der Karteikasten füllt sich, OHNE dass /karteikasten geöffnet wurde', () => {
    // Zweimal nachgeschlagen — das ist das Lernsignal.
    visitDetail(MUSCLE.id).unmount()
    visitDetail(MUSCLE.id).unmount()
    expect(useProgressStore.getState().flashcards.cards).toEqual({})

    renderToday()

    expect(screen.getByText(/Zuletzt nachgeschlagen/i)).toBeInTheDocument()
    expect(screen.getByText(/2× nachgeschlagen/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Als Karte lernen/i }))

    // Die Karte liegt im Kasten — angefasst wurde nur Detailseite und Heute-Screen.
    expect(useProgressStore.getState().isInDeck(MUSCLE.nameLatin)).toBe(true)
    // Und der Zähler ist zurückgesetzt: im Kasten ist er keine Lücke mehr.
    expect(useLookupStore.getState().lookups.entries[MUSCLE.nameLatin]).toBeUndefined()
  })

  it('was im Kasten liegt, wird nicht mehr vorgeschlagen', () => {
    useProgressStore.getState().addCard(MUSCLE.nameLatin)
    visitDetail(MUSCLE.id).unmount()

    renderToday()

    expect(screen.queryByText(/Zuletzt nachgeschlagen/i)).not.toBeInTheDocument()
  })

  it('„Zu Lernkarten" auf der Detailseite löscht den Zähler gleich mit', () => {
    visitDetail(MUSCLE.id)
    fireEvent.click(screen.getByRole('button', { name: /Zu Lernkarten/i }))

    expect(useProgressStore.getState().isInDeck(MUSCLE.nameLatin)).toBe(true)
    expect(useLookupStore.getState().lookups.entries[MUSCLE.nameLatin]).toBeUndefined()
  })
})
