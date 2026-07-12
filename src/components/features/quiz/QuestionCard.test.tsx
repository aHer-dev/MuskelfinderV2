import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import { getMuscleByLatinName } from '../../../data'
import type { Muscle, QuizQuestion } from '../../../types'

const SUPRA = getMuscleByLatinName('M. supraspinatus') as Muscle
const SOLEUS = getMuscleByLatinName('M. soleus') as Muscle

const QUESTION: QuizQuestion = {
  id: 'q0',
  mode: 'function-to-muscle',
  concreteMode: 'function-to-muscle',
  category: 'Funktion → Muskel',
  muscleId: SUPRA.id,
  prompt: SUPRA.functionDescription,
  options: [
    { id: 'o0', label: SUPRA.nameLatin, muscleId: SUPRA.id },
    { id: 'o1', label: SOLEUS.nameLatin, muscleId: SOLEUS.id },
  ],
  correctId: 'o0',
}

describe('QuestionCard — Falschantwort erklärt sich (7e)', () => {
  it('zeigt nach einer falschen Antwort den Erklärsatz, nicht nur die Lösung', () => {
    render(
      <QuestionCard question={QUESTION} phase="revealed" selectedId="o1" onAnswer={vi.fn()} />,
    )

    expect(screen.getByText(/Leider falsch/i)).toBeInTheDocument()
    // Der Unterschied wird benannt — nicht nur „richtig ist X".
    expect(screen.getByText(/Gesucht war M. supraspinatus/i)).toBeInTheDocument()
  })

  it('nach einer richtigen Antwort gibt es nichts zu erklären', () => {
    render(
      <QuestionCard question={QUESTION} phase="revealed" selectedId="o0" onAnswer={vi.fn()} />,
    )

    expect(screen.getByText('Richtig!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Beide vergleichen/i })).not.toBeInTheDocument()
  })

  it('„Beide vergleichen" öffnet ein Sheet ÜBER der Frage — die Frage bleibt stehen', () => {
    render(
      <QuestionCard question={QUESTION} phase="revealed" selectedId="o1" onAnswer={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Beide vergleichen/i }))

    const sheet = screen.getByRole('dialog')
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    // Beide Muskeln stehen nebeneinander, jeder mit seiner Rolle beschriftet.
    expect(within(sheet).getByText('Gesucht war')).toBeInTheDocument()
    expect(within(sheet).getByText('Du hattest gewählt')).toBeInTheDocument()
    expect(within(sheet).getByRole('heading', { name: 'M. supraspinatus' })).toBeInTheDocument()
    expect(within(sheet).getByRole('heading', { name: 'M. soleus' })).toBeInTheDocument()

    // Die Frage selbst ist nicht verschwunden (kein navigate, kein Unmount).
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()

    fireEvent.click(within(sheet).getByRole('button', { name: /Zurück zur Frage/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getByText(/Leider falsch/i)).toBeInTheDocument()
  })

  it('das Sheet hebt genau das Merkmal hervor, nach dem gefragt war', () => {
    const innervation: QuizQuestion = {
      ...QUESTION,
      mode: 'innervation',
      concreteMode: 'innervation',
      options: [
        { id: 'o0', label: SUPRA.innervation, muscleId: SUPRA.id },
        { id: 'o1', label: SOLEUS.innervation, muscleId: SOLEUS.id },
      ],
    }

    render(
      <QuestionCard question={innervation} phase="revealed" selectedId="o1" onAnswer={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Beide vergleichen/i }))

    const asked = document.querySelectorAll('.explain-row--asked')
    expect(asked).toHaveLength(2) // je Karte eine Zeile
    for (const row of asked) {
      expect(row.querySelector('dt')?.textContent).toBe('Innervation')
    }
  })
})
