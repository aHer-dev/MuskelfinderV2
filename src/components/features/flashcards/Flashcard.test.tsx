import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Flashcard } from './Flashcard'
import { facts } from './facts'
import { getMuscles } from '../../../data'
import type { Muscle } from '../../../types'

const base = getMuscles()[0]
const withSegments: Muscle = { ...base, nameLatin: 'M. testus', segments: 'C5, C6' }
const withoutSegments: Muscle = { ...base, nameLatin: 'M. testus', segments: '' }

describe('Flashcard — Fakten der Rückseite', () => {
  it('blendet leere Felder aus (Segmente fehlen bei 48 von 150 Muskeln)', () => {
    const labels = facts(withoutSegments).map((f) => f.label)
    expect(labels).not.toContain('Segmente')
    expect(labels).toEqual(['Funktion', 'Innervation', 'Ursprung', 'Ansatz'])
  })

  it('zeigt Segmente, wenn vorhanden', () => {
    expect(facts(withSegments)).toContainEqual({ label: 'Segmente', value: 'C5, C6' })
  })

  it('kein Muskel im Datenbestand erzeugt ein Fakt ohne Wert', () => {
    for (const muscle of getMuscles()) {
      for (const fact of facts(muscle)) {
        expect(fact.value.trim(), `${muscle.nameLatin} → ${fact.label}`).not.toBe('')
      }
    }
  })

  it('Rückseite nennt den Muskelnamen — sonst ist nach dem Umdrehen der Bezug weg', () => {
    render(<Flashcard muscle={withSegments} revealed onReveal={() => {}} />)
    expect(screen.getAllByText('M. testus').length).toBeGreaterThanOrEqual(2)
  })
})
