import { describe, expect, it } from 'vitest'
import { buildMuscleKey, isSupportedIn3D, threeDUrl, THREE_D_BASE_URL } from './threeD'

describe('buildMuscleKey', () => {
  it('normalisiert wie V1 (Präfix, Diakritika, Sonderzeichen)', () => {
    expect(buildMuscleKey('M. abductor digiti minimi')).toBe('m_abductor_digiti_minimi')
    expect(buildMuscleKey('Musculus flexor carpi radialis')).toBe('m_flexor_carpi_radialis')
    expect(buildMuscleKey('M. gluteus maximus')).toBe('m_gluteus_maximus')
    expect(buildMuscleKey('')).toBe('')
  })
})

describe('isSupportedIn3D', () => {
  it('erkennt einen im Mapping enthaltenen Muskel', () => {
    expect(isSupportedIn3D('M. abductor digiti minimi')).toBe(true)
  })
  it('lehnt unbekannte Muskeln ab', () => {
    expect(isSupportedIn3D('M. gibt-es-nicht')).toBe(false)
  })
})

describe('threeDUrl', () => {
  it('baut die externe URL mit Muskel-Kontext', () => {
    const url = new URL(threeDUrl('M. deltoideus', 'https://x/#/muskel/deltoideus'))
    expect(url.origin + url.pathname).toBe(THREE_D_BASE_URL)
    expect(url.searchParams.get('muscleKey')).toBe('m_deltoideus')
    expect(url.searchParams.get('muscle')).toBe('M. deltoideus')
    expect(url.searchParams.get('source')).toBe('muskelfinder')
    expect(url.searchParams.get('returnTo')).toBe('https://x/#/muskel/deltoideus')
  })
})
