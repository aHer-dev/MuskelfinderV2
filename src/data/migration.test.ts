import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

interface GeneratedMuscle {
  id: string
  nameLatin: string
  origin: string
  functionDescription: string
  innervation: string
  segments: string
  images: Array<{ url: string; attribution: string; license: string }>
  easy?: { segments: string }
}

interface MigrationReport {
  counts: {
    sourceRows: number
    muscles: number
    copiedImages: number
    musclesWithoutImages: number
  }
  emptyImages: Array<{ nameLatin: string }>
}

const repoRoot = process.cwd()
const fixtureRoot = path.join(repoRoot, 'src/data/__fixtures__/v1-muskelfinder')
const migrateScript = path.join(repoRoot, 'scripts/migrate-v1-data.mjs')

describe('V1 data migration', () => {
  it('converts the Sheet1 wrapper into typed V2 data and copies referenced images', () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'muskelfinder-migration-'))
    const dataOut = path.join(tempRoot, 'data')
    const publicOut = path.join(tempRoot, 'public/muscles')
    const reportOut = path.join(tempRoot, 'report.json')

    try {
      execFileSync(
        'node',
        [
          migrateScript,
          '--source',
          fixtureRoot,
          '--data-out',
          dataOut,
          '--public-out',
          publicOut,
          '--report-out',
          reportOut,
        ],
        { cwd: repoRoot },
      )

      const musclesJson = readFileSync(path.join(dataOut, 'muscles.json'), 'utf8')
      const muscles = JSON.parse(musclesJson) as GeneratedMuscle[]
      const report = JSON.parse(readFileSync(reportOut, 'utf8')) as MigrationReport

      expect(musclesJson).not.toContain('Sheet1')
      expect(muscles).toHaveLength(2)
      expect(new Set(muscles.map((muscle) => muscle.id)).size).toBe(2)
      expect(muscles.map((muscle) => muscle.nameLatin)).toEqual(['M. test muscle', 'M. test muscle'])

      const upper = muscles.find((muscle) => muscle.id.includes('upper'))
      expect(upper?.origin).toContain('Pars superior: Testursprung 1')
      expect(upper?.functionDescription).toBe('Bewegt den Testarm.')
      expect(upper?.innervation).toBe('N. axillaris')
      expect(upper?.segments).toBe('C5, C6')
      expect(upper?.easy?.segments).toBe('C5, C6')
      expect(upper?.images[0]).toMatchObject({
        url: 'muscles/obere-ext/test_muscle_ventral_1.jpg',
        attribution: 'Fixture',
        license: 'CC BY 4.0',
      })
      expect(existsSync(path.join(publicOut, 'obere-ext/test_muscle_ventral_1.jpg'))).toBe(true)

      expect(report.counts.sourceRows).toBe(2)
      expect(report.counts.muscles).toBe(2)
      expect(report.counts.copiedImages).toBe(1)
      expect(report.counts.musclesWithoutImages).toBe(1)
      expect(report.emptyImages[0]?.nameLatin).toBe('M. test muscle')
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
})
