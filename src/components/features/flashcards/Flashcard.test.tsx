import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Flashcard } from './Flashcard'
import { facts } from './facts'
import { UNGEPRUEFT_MARKE, UNGEPRUEFT_ERKLAERUNG } from '../../../data/muscle-fields'
import { getMuscles } from '../../../data'
import type { Muscle } from '../../../types'

const base = getMuscles()[0]
const withSegments: Muscle = { ...base, nameLatin: 'M. testus', segments: 'C5, C6' }
const withoutSegments: Muscle = { ...base, nameLatin: 'M. testus', segments: '' }

describe('Flashcard — Fakten der Rückseite', () => {
  it('blendet leere Felder aus (Segmente fehlen bei 48 von 150 Muskeln)', () => {
    const labels = facts(withoutSegments).map((f) => f.label)
    expect(labels).not.toContain('Segmente')
    expect(labels).toEqual(['Ursprung', 'Ansatz', 'Funktion', 'Innervation'])
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

describe('Flashcard — die Stern-Legende', () => {
  const ungeprueft: Muscle = { ...base, nameLatin: 'M. testus', segments: 'C5, C6', segmentsUngeprueft: true }
  const geprueft: Muscle = { ...base, nameLatin: 'M. testus', segments: 'C5, C6', segmentsUngeprueft: false }

  /* Der eigentliche Defekt: Die Karte TRUG den Stern, erklaerte ihn aber nie — nur
     die Detailseite tat das. Auf der Lernkarte ist das teurer: Hier wird der Wert
     eingepraegt, ein ungeprueftes Datum ohne Hinweis wird als gesichert gelernt. */
  it('erklärt den Stern, wenn ein Wert ihn trägt', () => {
    render(<Flashcard muscle={ungeprueft} revealed onReveal={() => {}} />)
    expect(screen.getByText(`Segmente${UNGEPRUEFT_MARKE}`)).toBeInTheDocument()
    expect(screen.getByText(UNGEPRUEFT_ERKLAERUNG)).toBeInTheDocument()
  })

  it('zeigt keine Legende ohne Marke — eine Warnung ohne Anlass wäre schlimmer', () => {
    render(<Flashcard muscle={geprueft} revealed onReveal={() => {}} />)
    expect(screen.queryByText(UNGEPRUEFT_ERKLAERUNG)).not.toBeInTheDocument()
  })

  it('sagt auf Karte und Detailseite WÖRTLICH dasselbe', () => {
    /* Zwei Fassungen derselben Erklaerung waeren schlimmer als eine: Der Lernende
       muesste entscheiden, ob zwei verschiedene Dinge gemeint sind. */
    render(<Flashcard muscle={ungeprueft} revealed onReveal={() => {}} />)
    expect(screen.getByText(UNGEPRUEFT_ERKLAERUNG).textContent).toBe(UNGEPRUEFT_ERKLAERUNG)
  })

  it('jeder ungeprüfte Muskel des ECHTEN Bestands bekommt die Legende', () => {
    const echte = getMuscles().filter((m) => m.segmentsUngeprueft === true)
    expect(echte.length).toBeGreaterThan(0)
    for (const m of echte) {
      const { unmount } = render(<Flashcard muscle={m} revealed onReveal={() => {}} />)
      expect(screen.getByText(UNGEPRUEFT_ERKLAERUNG), m.nameLatin).toBeInTheDocument()
      unmount()
    }
  })
})
