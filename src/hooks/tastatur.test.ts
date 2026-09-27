import { afterEach, describe, expect, it } from 'vitest'
import { modalOffen, tasteGehoertDerSeite } from './tastatur'

function taste(ziel: EventTarget): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: '1', bubbles: true })
  Object.defineProperty(event, 'target', { value: ziel })
  return event
}

describe('tasteGehoertDerSeite — wann Kürzel der Seite schweigen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('ohne Feld und ohne Kasten gehört die Taste der Seite', () => {
    expect(tasteGehoertDerSeite(taste(document.body))).toBe(true)
  })

  it('in Eingabefeld, Textfeld und Auswahlliste NICHT', () => {
    for (const tag of ['input', 'textarea', 'select'] as const) {
      const feld = document.createElement(tag)
      document.body.append(feld)
      expect(tasteGehoertDerSeite(taste(feld)), tag).toBe(false)
    }
  })

  it('bei offenem modalem Kasten NICHT — egal, wo der Fokus steht', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)

    expect(modalOffen()).toBe(true)
    expect(tasteGehoertDerSeite(taste(document.body))).toBe(false)
  })

  it('ein NICHT modaler Dialog sperrt nichts', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)

    expect(modalOffen()).toBe(false)
    expect(tasteGehoertDerSeite(taste(document.body))).toBe(true)
  })
})
