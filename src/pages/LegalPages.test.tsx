import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SourcesPage } from './SourcesPage'
import { PrivacyPage } from './PrivacyPage'

function renderPage(node: React.ReactElement) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('SourcesPage', () => {
  it('zeigt Titel und die CC-BY-4.0-Attribution (Pflicht, ADR 0002)', () => {
    renderPage(<SourcesPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Quellen & Lizenzen/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/BodyParts3D, © DBCLS, CC BY 4\.0/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Creative Commons BY 4\.0/i }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/')
  })
})

describe('PrivacyPage', () => {
  it('zeigt Titel und den localStorage-Hinweis', () => {
    renderPage(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Datenschutz/i })).toBeInTheDocument()
    expect(screen.getByText(/kein Nutzerkonto/i)).toBeInTheDocument()
  })
})
