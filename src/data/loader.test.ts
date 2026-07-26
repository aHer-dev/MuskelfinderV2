import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CARD_MUSCLES,
  getMovements,
  getMuscleById,
  getMuscleByCardKey,
  getMuscles,
  getRegions,
  isCardMuscle,
} from './loader'
import { cardKey } from './card-key'

const publicRoot = path.join(process.cwd(), 'public')

describe('muscle data loader', () => {
  it('loads the migrated V1 muscle data as validated V2 objects', () => {
    const muscles = getMuscles()
    const ids = new Set(muscles.map((muscle) => muscle.id))

    expect(muscles).toHaveLength(150)
    expect(ids.size).toBe(muscles.length)
    expect(JSON.stringify(muscles)).not.toContain('Sheet1')

    const pectoralisMinor = getMuscleById('pectoralis-minor')
    expect(pectoralisMinor?.nameLatin).toBe('M. pectoralis minor')
    expect(pectoralisMinor?.innervation).toBe('N. pectoralis medialis')
    expect(pectoralisMinor?.segments).toBe('C6, C7, C8, Th1')
    expect(pectoralisMinor?.taCode).toBeUndefined()

    const deltoideus = getMuscleById('deltoideus')
    expect(deltoideus?.functionDescription).toContain('Abduktion')
    expect(deltoideus?.easy?.functionDescription).toBeTruthy()
  })

  it('keeps region and movement dictionaries consistent with the muscles', () => {
    const muscles = getMuscles()
    const regions = getRegions()
    const movements = getMovements()
    const movementIds = new Set(movements.map((movement) => movement.id))

    expect(regions.map((region) => region.id)).toEqual(['upper', 'lower', 'trunk', 'head'])
    expect(regions.reduce((sum, region) => sum + region.count, 0)).toBe(muscles.length)
    expect(new Set(movements.map((movement) => movement.id)).size).toBe(movements.length)

    for (const muscle of muscles) {
      expect(muscle.nameLatin).toBeTruthy()
      expect(muscle.origin).toBeTruthy()
      expect(muscle.insertion).toBeTruthy()
      expect(muscle.functions.length).toBeGreaterThan(0)
      for (const functionId of muscle.functions) {
        expect(movementIds.has(functionId)).toBe(true)
      }
    }
  })

  it('keeps every migrated image base-safe and attributed', () => {
    const images = getMuscles().flatMap((muscle) => muscle.images)

    expect(images.length).toBe(168)
    for (const image of images) {
      expect(image.url.startsWith('muscles/')).toBe(true)
      expect(image.attribution).toBeTruthy()
      expect(image.license).toBe('CC BY 4.0')
      expect(existsSync(path.join(publicRoot, image.url))).toBe(true)
    }
  })
})

/* Seit ADR 0012 ist der Karten-Schluessel NICHT der Anzeigename. Fuenf `nameLatin` gibt es
   weiterhin zweimal, aber sie zerfallen in zwei Faelle: Hand/Fuss sind zwei Muskeln (zwei
   Karten, zwei Schluessel), `M. nasalis` und `M. occipitofrontalis` sind je EIN Muskel in
   zwei Funktionszeilen (eine Karte, ein Schluessel). Wer beim Lesen ueber alle 150 laeuft,
   findet fuer die zweite Sorte ZWEI Muskeln zu EINER Karte — genau daran zeigte der
   Karteikasten 56 Zeilen fuer 53 Karten, und „Entfernen" loeschte beide auf einmal. */
describe('isCardMuscle — ein Muskel je Karten-Schluessel', () => {
  it('haelt fest, dass fuenf Namen doppelt vergeben sind', () => {
    const namen = getMuscles().map((m) => m.nameLatin)
    const doppelt = [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))]

    expect(doppelt.sort()).toEqual([
      'M. abductor digiti minimi',
      'M. flexor digiti minimi brevis',
      'M. nasalis',
      'M. occipitofrontalis',
      'M. opponens digiti minimi',
    ])
  })

  it('entdoppelt NUR die Funktionszeilen-Paare — Hand und Fuss bleiben zwei Karten', () => {
    /* 150 Muskeln minus die zwei Kopf-Paare = 148 Karten. Stuende hier 145, waeren die drei
       Handmuskeln wieder verschluckt — der Zustand vor ADR 0012. */
    expect(CARD_MUSCLES).toHaveLength(getMuscles().length - 2)

    const schluessel = CARD_MUSCLES.map((m) => cardKey(m))
    expect(new Set(schluessel).size).toBe(schluessel.length)
  })

  it('waehlt DEN Muskel, den die Karte auch rendert', () => {
    // Sonst zeigte die Kasten-Zeile einen anderen Muskel als die Lernkarte darunter.
    for (const muscle of CARD_MUSCLES) {
      expect(getMuscleByCardKey(cardKey(muscle))).toBe(muscle)
    }
    for (const muscle of getMuscles()) {
      expect(isCardMuscle(muscle)).toBe(getMuscleByCardKey(cardKey(muscle)) === muscle)
    }
  })
})
