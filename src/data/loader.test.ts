import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getMovements, getMuscleById, getMuscles, getRegions } from './loader'

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
