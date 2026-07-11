import type {
  Difficulty,
  Movement,
  Muscle,
  MuscleEasyFields,
  MuscleImage,
  Region,
  RegionId,
} from '../types'

const REGION_IDS: readonly RegionId[] = ['upper', 'lower', 'trunk', 'head']

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataValidationError'
  }
}

export function validateMuscles(input: unknown): Muscle[] {
  const records = readArray(input, 'muscles')
  const ids = new Set<string>()

  return records.map((record, index) => {
    const muscle = validateMuscle(record, `muscles[${index}]`)
    if (ids.has(muscle.id)) {
      throw new DataValidationError(`Duplicate muscle id: ${muscle.id}`)
    }
    ids.add(muscle.id)
    return muscle
  })
}

export function validateRegions(input: unknown): Region[] {
  return readArray(input, 'regions').map((record, index) => {
    const path = `regions[${index}]`
    const item = readRecord(record, path)
    return {
      id: readRegionId(item.id, `${path}.id`),
      label: readString(item.label, `${path}.label`),
      count: readNonNegativeInteger(item.count, `${path}.count`),
    }
  })
}

export function validateMovements(input: unknown): Movement[] {
  const ids = new Set<string>()
  return readArray(input, 'movements').map((record, index) => {
    const path = `movements[${index}]`
    const item = readRecord(record, path)
    const movement = {
      id: readString(item.id, `${path}.id`),
      label: readString(item.label, `${path}.label`),
    }
    if (ids.has(movement.id)) {
      throw new DataValidationError(`Duplicate movement id: ${movement.id}`)
    }
    ids.add(movement.id)
    return movement
  })
}

function validateMuscle(input: unknown, path: string): Muscle {
  const item = readRecord(input, path)
  return {
    id: readString(item.id, `${path}.id`),
    nameLatin: readString(item.nameLatin, `${path}.nameLatin`),
    nameDE: readOptionalString(item.nameDE, `${path}.nameDE`),
    taCode: readOptionalString(item.taCode, `${path}.taCode`),
    region: readRegionId(item.region, `${path}.region`),
    subregion: readString(item.subregion, `${path}.subregion`),
    joints: readStringArray(item.joints, `${path}.joints`),
    origin: readString(item.origin, `${path}.origin`),
    insertion: readString(item.insertion, `${path}.insertion`),
    functions: readStringArray(item.functions, `${path}.functions`, { minLength: 1 }),
    functionDescription: readString(item.functionDescription, `${path}.functionDescription`),
    innervation: readString(item.innervation, `${path}.innervation`),
    segments: readString(item.segments, `${path}.segments`, { allowEmpty: true }),
    clinicalNote: readOptionalString(item.clinicalNote, `${path}.clinicalNote`),
    difficulty: readDifficulty(item.difficulty, `${path}.difficulty`),
    images: readArray(item.images, `${path}.images`).map((image, index) =>
      validateImage(image, `${path}.images[${index}]`),
    ),
    tags: readStringArray(item.tags, `${path}.tags`),
    easy: item.easy === undefined ? undefined : validateEasyFields(item.easy, `${path}.easy`),
  }
}

function validateImage(input: unknown, path: string): MuscleImage {
  const item = readRecord(input, path)
  return {
    id: readString(item.id, `${path}.id`),
    url: readString(item.url, `${path}.url`),
    view: readString(item.view, `${path}.view`),
    attribution: readString(item.attribution, `${path}.attribution`),
    license: readString(item.license, `${path}.license`),
    licenseUrl: readOptionalString(item.licenseUrl, `${path}.licenseUrl`),
    sourceUrl: readOptionalString(item.sourceUrl, `${path}.sourceUrl`),
  }
}

function validateEasyFields(input: unknown, path: string): MuscleEasyFields {
  const item = readRecord(input, path)
  return {
    origin: readString(item.origin, `${path}.origin`),
    insertion: readString(item.insertion, `${path}.insertion`),
    functionDescription: readString(item.functionDescription, `${path}.functionDescription`),
    innervation: readString(item.innervation, `${path}.innervation`),
    segments: readString(item.segments, `${path}.segments`, { allowEmpty: true }),
  }
}

function readRecord(input: unknown, path: string): Record<string, unknown> {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return input as Record<string, unknown>
  }
  throw new DataValidationError(`${path} must be an object.`)
}

function readArray(input: unknown, path: string): unknown[] {
  if (Array.isArray(input)) {
    return input
  }
  throw new DataValidationError(`${path} must be an array.`)
}

function readString(
  input: unknown,
  path: string,
  options: { allowEmpty?: boolean } = {},
): string {
  if (typeof input !== 'string') {
    throw new DataValidationError(`${path} must be a string.`)
  }
  if (!options.allowEmpty && input.trim().length === 0) {
    throw new DataValidationError(`${path} must not be empty.`)
  }
  return input
}

function readOptionalString(input: unknown, path: string): string | undefined {
  if (input === undefined) {
    return undefined
  }
  return readString(input, path)
}

function readStringArray(
  input: unknown,
  path: string,
  options: { minLength?: number } = {},
): string[] {
  const values = readArray(input, path).map((value, index) => readString(value, `${path}[${index}]`))
  if (options.minLength !== undefined && values.length < options.minLength) {
    throw new DataValidationError(`${path} must contain at least ${options.minLength} item(s).`)
  }
  return values
}

function readRegionId(input: unknown, path: string): RegionId {
  if (typeof input === 'string' && REGION_IDS.includes(input as RegionId)) {
    return input as RegionId
  }
  throw new DataValidationError(`${path} must be a known region id.`)
}

function readDifficulty(input: unknown, path: string): Difficulty {
  if (input === 1 || input === 2 || input === 3) {
    return input
  }
  throw new DataValidationError(`${path} must be a difficulty from 1 to 3.`)
}

function readNonNegativeInteger(input: unknown, path: string): number {
  if (Number.isInteger(input) && Number(input) >= 0) {
    return Number(input)
  }
  throw new DataValidationError(`${path} must be a non-negative integer.`)
}
