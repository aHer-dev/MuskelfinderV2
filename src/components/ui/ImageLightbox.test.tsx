import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageLightbox } from './ImageLightbox'

/* Ein echter Ausloeser gehoert dazu: Ohne ihn liesse sich die Fokus-Rueckgabe nicht
   pruefen — und genau die vergisst man beim zweiten modalen Kasten. */
function Rahmen() {
  const [offen, setOffen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOffen(true)}>
        Bild groß anzeigen
      </button>
      <ImageLightbox
        open={offen}
        src="/muscles/test.jpg"
        alt="Anatomie-Ansicht zum Erraten"
        onClose={() => setOffen(false)}
      />
    </>
  )
}

const oeffne = () => fireEvent.click(screen.getByRole('button', { name: 'Bild groß anzeigen' }))
const flaecheDaneben = () => document.querySelector('.lightbox') as HTMLElement

describe('ImageLightbox — das Bild formatfüllend', () => {
  it('ist zu, bis man sie öffnet', () => {
    render(<Rahmen />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('öffnet als modaler Kasten und zeigt dasselbe Bild', () => {
    render(<Rahmen />)
    oeffne()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    /* Der Name des Kastens ist die Bildbeschreibung — ein Dialog ohne Namen wird als
       „Dialog" angesagt und sagt damit nichts. */
    expect(dialog).toHaveAttribute('aria-label', 'Anatomie-Ansicht zum Erraten')
    expect(screen.getByAltText('Anatomie-Ansicht zum Erraten')).toBeInTheDocument()
  })

  it('Esc schließt — ein Kasten ohne Tastaturausgang ist eine Falle', () => {
    render(<Rahmen />)
    oeffne()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('die Fläche daneben schließt, das Bild selbst NICHT', () => {
    render(<Rahmen />)
    oeffne()

    /* Beim Betrachten tippt man leicht auf das Bild. Wer dabei die Ansicht verliert,
       die er gerade erst geöffnet hat, hält das für einen Fehler. */
    fireEvent.click(screen.getByAltText('Anatomie-Ansicht zum Erraten'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(flaecheDaneben())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('der Schließen-Knopf hat einen Namen — nicht nur ein Kreuz', () => {
    render(<Rahmen />)
    oeffne()

    fireEvent.click(screen.getByRole('button', { name: 'Vollansicht schließen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('der Fokus kommt zum Auslöser zurück', () => {
    render(<Rahmen />)
    const ausloeser = screen.getByRole('button', { name: 'Bild groß anzeigen' })
    ausloeser.focus()
    fireEvent.click(ausloeser)

    expect(screen.getByRole('dialog')).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    /* Ohne Rückgabe stünde man nach dem Schließen wieder am Seitenanfang und müsste
       sich zur Frage zurücktabben. */
    expect(ausloeser).toHaveFocus()
  })

  it('die Seite dahinter scrollt nicht — und darf es danach wieder', () => {
    render(<Rahmen />)
    oeffne()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
