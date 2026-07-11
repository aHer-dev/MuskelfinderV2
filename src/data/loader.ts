import musclesData from './generated/muscles.json'
import movementsData from './generated/movements.json'
import regionsData from './generated/regions.json'
import type { Movement, Muscle, Region } from '../types'
import { validateMovements, validateMuscles, validateRegions } from './validation'

const muscles = validateMuscles(musclesData as unknown)
const regions = validateRegions(regionsData as unknown)
const movements = validateMovements(movementsData as unknown)
const musclesById = new Map(muscles.map((muscle) => [muscle.id, muscle]))
const musclesByName = new Map(muscles.map((muscle) => [muscle.nameLatin, muscle]))

export const MUSCLES: readonly Muscle[] = Object.freeze(muscles)
export const REGIONS: readonly Region[] = Object.freeze(regions)
export const MOVEMENTS: readonly Movement[] = Object.freeze(movements)

export function getMuscles(): readonly Muscle[] {
  return MUSCLES
}

export function getRegions(): readonly Region[] {
  return REGIONS
}

export function getMovements(): readonly Movement[] {
  return MOVEMENTS
}

export function getMuscleById(id: string): Muscle | undefined {
  return musclesById.get(id)
}

/** Lookup nach lateinischem Namen — Schlüssel der Persistenz-/Backup-Schicht (ADR 0002 §2). */
export function getMuscleByLatinName(name: string): Muscle | undefined {
  return musclesByName.get(name)
}
