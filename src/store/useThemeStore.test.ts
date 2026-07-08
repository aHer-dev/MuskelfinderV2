import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'light' })
  })

  it('startet mit hellem Theme (Marken-Default)', () => {
    expect(useThemeStore.getState().theme).toBe('light')
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
