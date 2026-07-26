import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useThemeStore } from './useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'light' })
  })

  it('toggle schaltet zwischen light und dark', () => {
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('setTheme setzt das Theme direkt', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('persistiert das Theme unter dem Key mf.theme', () => {
    useThemeStore.getState().setTheme('dark')
    const raw = localStorage.getItem('mf.theme')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw as string).state.theme).toBe('dark')
  })
})

/* ── Der Default ist HELL, auch auf einem Gerät im Nachtmodus (2026-07-26) ──
   Der bisherige Test „startet mit hellem Theme" war eine Tautologie: Sein `beforeEach` setzte
   `theme: 'light'` und danach prüfte er, dass es 'light' ist — er wäre auch grün geblieben,
   als der Store der Systemvorgabe folgte. Diese Gruppe prüft die Vorgabe wirklich: frisch
   importierter Store, `prefers-color-scheme: dark` am Gerät. */
describe('Vorgabe: hell, unabhängig vom Gerät', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function frischerStore(systemIstDunkel: boolean) {
    localStorage.clear()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: systemIstDunkel && query.includes('dark'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }))
    vi.resetModules()
    const mod = await import('./useThemeStore')
    return mod.useThemeStore
  }

  it('ein Gerät im Nachtmodus bekommt trotzdem HELL', async () => {
    const store = await frischerStore(true)
    expect(store.getState().theme).toBe('light')
  })

  it('ein Gerät im Tagmodus natürlich auch', async () => {
    const store = await frischerStore(false)
    expect(store.getState().theme).toBe('light')
  })

  it('eine ausdrückliche Wahl schlägt die Vorgabe — sonst gäbe es keinen Weg zu Dunkel', async () => {
    localStorage.setItem('mf.theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
    vi.resetModules()
    const mod = await import('./useThemeStore')
    expect(mod.useThemeStore.getState().theme).toBe('dark')
  })
})

/* ── Drei Stellen, eine Regel (2026-07-26) ──
   Die Vorgabe steht im Store, im No-Flash-Skript (`index.html`, vor dem ersten Paint) und in
   der `theme-color` der Browserleiste. Laufen sie auseinander, blitzt beim Laden die falsche
   Farbe oder die Systemleiste passt nicht zur Seite — beides sieht nach „kaputt" aus und
   fällt in keinem Unit-Test auf, der nur den Store kennt. */
describe('index.html trägt dieselbe Vorgabe wie der Store', () => {
  const html = readFileSync(resolve(__dirname, '..', '..', 'index.html'), 'utf8')

  it('das No-Flash-Skript fällt auf hell zurück', () => {
    expect(html).toMatch(/DEFAULT_THEME\s*=\s*'light'/)
  })

  it('es fragt das Gerät NICHT mehr nach prefers-color-scheme', () => {
    /* Genau diese Abfrage war die Vorgabe „folgt dem Gerät". Bleibt sie stehen, während der
       Store hell vorgibt, bekommt ein Nachtmodus-Handy einen dunklen Erst-Paint und die App
       springt danach auf hell.

       Gemessen wird der SKRIPT-Inhalt, nicht die ganze Datei: In den Kommentaren daneben
       steht der Begriff absichtlich (er erklärt, warum er im Code nichts mehr zu suchen hat),
       und ein Test, der über Prosa stolpert, erzieht dazu, Erklärungen zu löschen. */
    const skript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
    expect(skript).toContain('DEFAULT_THEME')
    expect(skript).not.toMatch(/prefers-color-scheme|matchMedia/)
  })

  it('es gibt genau EINE theme-color, und die steht auf der hellen Fläche', () => {
    const treffer = html.match(/<meta\s+name="theme-color"[^>]*>/g) ?? []
    expect(treffer).toHaveLength(1)
    expect(treffer[0]).toContain('#f1efe9')
  })

  it('das <html>-Element startet auf light', () => {
    expect(html).toMatch(/<html[^>]*data-theme="light"/)
  })
})
