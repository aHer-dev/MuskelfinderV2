import { describe, expect, it } from 'vitest'
import { buildMuscleKey, isSupportedIn3D, threeDUrl, THREE_D_BASE_URL } from './threeD'
import { getMuscles } from './index'

describe('buildMuscleKey', () => {
  it('normalisiert Präfix, Diakritika, Sonderzeichen', () => {
    expect(buildMuscleKey('M. abductor digiti minimi')).toBe('m_abductor_digiti_minimi')
    expect(buildMuscleKey('Musculus flexor carpi radialis')).toBe('m_flexor_carpi_radialis')
    expect(buildMuscleKey('M. gluteus maximus')).toBe('m_gluteus_maximus')
    expect(buildMuscleKey('')).toBe('')
  })

  it('fängt den Plural „Mm." — sonst entsteht m_mm_… und trifft keinen Mapping-Key', () => {
    expect(buildMuscleKey('Mm. lumbricales I–IV')).toBe('m_lumbricales_i_iv')
    expect(buildMuscleKey('Mm. interossei dorsales I–IV')).toBe('m_interossei_dorsales_i_iv')
    expect(buildMuscleKey('Musculi splenii')).toBe('m_splenii')
  })

  it('erzeugt für keinen Muskel im Datenbestand einen m_mm_-Key', () => {
    for (const muscle of getMuscles()) {
      expect(buildMuscleKey(muscle.nameLatin), muscle.nameLatin).not.toMatch(/^m_mm?_/)
    }
  })
})

describe('isSupportedIn3D', () => {
  it('erkennt einen im Mapping enthaltenen Muskel', () => {
    expect(isSupportedIn3D('M. abductor digiti minimi')).toBe(true)
  })
  it('lehnt unbekannte Muskeln ab', () => {
    expect(isSupportedIn3D('M. gibt-es-nicht')).toBe(false)
  })
  it('erkennt auch Plural-Muskeln (waren vorher alle ohne 3D-Button)', () => {
    expect(isSupportedIn3D('Mm. lumbricales I–IV')).toBe(true)
    expect(isSupportedIn3D('Mm. splenii')).toBe(true)
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
