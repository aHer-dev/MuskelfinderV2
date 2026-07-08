import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const V1_REGION_FILES = [
  'obere-extremitaet',
  'untere-extremitaet',
  'wirbelsaeule',
  'kopf-hals',
]

const REGION_ID_MAP = {
  'obere-extremitaet': 'upper',
  'untere-extremitaet': 'lower',
  wirbelsaeule: 'trunk',
  'kopf-hals': 'head',
}

const IMAGE_PREFIX = '/assets/images/'

const VIEW_BY_TOKEN = {
  ventral: 'Ventral',
  dorsal: 'Dorsal',
  lateral: 'Lateral',
  medial: 'Medial',
  caudal: 'Kaudal',
  cranial: 'Kranial',
  plantar: 'Plantar',
  all: 'Gesamtansicht',
}

export async function migrateV1Data(options) {
  const sourceRoot = path.resolve(options.sourceRoot)
  const dataOut = path.resolve(options.dataOut)
  const publicOut = path.resolve(options.publicOut)
  const reportOut = options.reportOut ? path.resolve(options.reportOut) : null
  const config = await readJson(path.join(sourceRoot, 'data/config.json'))
  const regionsConfig = readRegionsConfig(config)
  const sourceRows = await readSourceRows(sourceRoot)
  const movementDictionary = buildMovementDictionary(
    sourceRows.flatMap(({ row }) => splitList(row.Movements)),
  )
  const nameCounts = countBy(sourceRows, ({ row }) => row.Name)
  const usedIds = new Set()
  const report = {
    sourceRoot: path.relative(process.cwd(), sourceRoot) || '.',
    counts: {
      sourceRows: sourceRows.length,
      muscles: 0,
      regions: regionsConfig.length,
      movements: movementDictionary.movements.length,
      imageReferences: 0,
      copiedImages: 0,
      musclesWithoutImages: 0,
    },
    duplicateNames: Object.entries(nameCounts)
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count })),
    segmentNotes: [],
    emptyImages: [],
    missingImages: [],
    unusedImageFiles: [],
  }
  const copiedImageUrls = new Set()

  await rm(publicOut, { recursive: true, force: true })
  await mkdir(publicOut, { recursive: true })
  await mkdir(dataOut, { recursive: true })

  const muscles = []
  for (const sourceRow of sourceRows) {
    const transformed = transformV1Row({
      sourceRow,
      regionsConfig,
      movementIdByLabel: movementDictionary.idByLabel,
      duplicateNameCount: nameCounts[sourceRow.row.Name] ?? 0,
      usedIds,
    })

    if (transformed.segmentNote) {
      report.segmentNotes.push(transformed.segmentNote)
    }

    if (transformed.imageRefs.length === 0) {
      report.emptyImages.push({
        source: sourceRow.source,
        index: sourceRow.index + 1,
        nameLatin: transformed.muscle.nameLatin,
      })
    }

    for (const imageRef of transformed.imageRefs) {
      report.counts.imageReferences += 1
      const sourceFile = path.join(sourceRoot, imageRef)
      const targetUrl = rewriteImageUrl(imageRef)
      const targetFile = path.join(publicOut, targetUrl.replace(/^muscles\//, ''))
      try {
        await mkdir(path.dirname(targetFile), { recursive: true })
        await copyFile(sourceFile, targetFile)
        copiedImageUrls.add(targetUrl)
      } catch {
        report.missingImages.push({
          source: sourceRow.source,
          index: sourceRow.index + 1,
          nameLatin: transformed.muscle.nameLatin,
          imageRef,
        })
      }
    }

    muscles.push(transformed.muscle)
  }

  report.counts.muscles = muscles.length
  report.counts.copiedImages = copiedImageUrls.size
  report.counts.musclesWithoutImages = report.emptyImages.length
  report.unusedImageFiles = await findUnusedImageFiles(sourceRoot, sourceRows)

  const regions = regionsConfig.map((region) => ({
    id: mapRegionId(region.id),
    label: region.name,
    count: muscles.filter((muscle) => muscle.region === mapRegionId(region.id)).length,
  }))

  await writeJson(path.join(dataOut, 'muscles.json'), muscles)
  await writeJson(path.join(dataOut, 'regions.json'), regions)
  await writeJson(path.join(dataOut, 'movements.json'), movementDictionary.movements)

  if (reportOut) {
    await mkdir(path.dirname(reportOut), { recursive: true })
    await writeJson(reportOut, report)
  }

  if (report.missingImages.length > 0) {
    throw new Error(`Migration failed: ${report.missingImages.length} image file(s) are missing.`)
  }

  return { muscles, regions, movements: movementDictionary.movements, report }
}

export function transformV1Row({
  sourceRow,
  regionsConfig,
  movementIdByLabel,
  duplicateNameCount,
  usedIds,
}) {
  const { row } = sourceRow
  const region = mapRegionId(row.region)
  const subregion = findSubregionLabel(regionsConfig, row.region, row.subgroup)
  const id = makeUniqueMuscleId(row, region, duplicateNameCount, usedIds)
  const imageRefs = extractImageRefs(row)
  const segmentSplit = splitInnervationSegments(row.Segments)
  const easySegmentSplit = splitInnervationSegments(pickEasyValue(row.easy?.Segments, row.Segments))
  const functions = unique(splitList(row.Movements).map((label) => movementIdByLabel.get(label) ?? slugify(label)))
  const attribution = normalizeAttribution(row.Attribution)

  const muscle = {
    id,
    nameLatin: requireString(row.Name, 'Name'),
    region,
    subregion,
    joints: splitList(row.Joints).filter((joint) => joint !== '-'),
    origin: normalizeRichText(row.Origin),
    insertion: normalizeRichText(row.Insertion),
    functions,
    functionDescription: requireString(row.Function, 'Function'),
    innervation: segmentSplit.innervation,
    segments: segmentSplit.segments,
    clinicalNote: optionalString(row.clinicalNote),
    difficulty: normalizeDifficulty(row.difficulty),
    images: imageRefs.map((imageRef, index) => ({
      id: `${id}-${index + 1}`,
      url: rewriteImageUrl(imageRef),
      view: inferImageView(imageRef, index),
      attribution: attribution.attribution,
      license: attribution.license,
      ...(attribution.licenseUrl ? { licenseUrl: attribution.licenseUrl } : {}),
      ...(attribution.sourceUrl ? { sourceUrl: attribution.sourceUrl } : {}),
    })),
    tags: normalizeTags(row.tags),
    easy: {
      origin: normalizeRichText(pickEasyValue(row.easy?.Origin, row.Origin)),
      insertion: normalizeRichText(pickEasyValue(row.easy?.Insertion, row.Insertion)),
      functionDescription: normalizeRichText(pickEasyValue(row.easy?.Function, row.Function)),
      innervation: easySegmentSplit.innervation,
      segments: easySegmentSplit.segments,
    },
  }

  return {
    muscle,
    imageRefs,
    segmentNote: segmentSplit.note
      ? {
          source: sourceRow.source,
          index: sourceRow.index + 1,
          nameLatin: muscle.nameLatin,
          raw: row.Segments,
          note: segmentSplit.note,
          innervation: segmentSplit.innervation,
          segments: segmentSplit.segments,
        }
      : null,
  }
}

function pickEasyValue(easyValue, fallbackValue) {
  return normalizeRichText(easyValue).length > 0 ? easyValue : fallbackValue
}

export function splitInnervationSegments(rawValue) {
  const raw = requireString(rawValue, 'Segments')
  const parts = splitTopLevelCommas(raw)
  const innervationParts = []
  const segmentParts = []
  const inlineSegments = []

  for (const part of parts) {
    if (isSpinalSegment(part)) {
      segmentParts.push(normalizeSegment(part))
      continue
    }

    const stripped = stripPureSegmentParentheses(part)
    const inline = extractSpinalSegments(part)
    inlineSegments.push(...inline)
    innervationParts.push(stripped)
  }

  const segments = unique([...segmentParts, ...inlineSegments]).join(', ')
  const innervation = innervationParts.join(', ').trim()
  let note = null
  if (!segments) {
    note = 'no-spinal-segment-detected'
  } else if (segmentParts.length === 0 && inlineSegments.length > 0) {
    note = 'spinal-segment-only-detected-inline'
  }

  return { innervation: innervation || raw, segments, note }
}

export function buildMovementDictionary(labels) {
  const sortedLabels = unique(labels).sort((left, right) => left.localeCompare(right, 'de'))
  const usedIds = new Map()
  const movements = []
  const idByLabel = new Map()

  for (const label of sortedLabels) {
    const baseId = slugify(label)
    const count = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, count + 1)
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`
    movements.push({ id, label })
    idByLabel.set(label, id)
  }

  return { movements, idByLabel }
}

export function splitList(value) {
  return splitTopLevelCommas(requireString(value, 'list'))
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '–')
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/&/g, ' und ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

async function readSourceRows(sourceRoot) {
  const sourceRows = []
  for (const source of V1_REGION_FILES) {
    const wrapper = await readJson(path.join(sourceRoot, `data/${source}.json`))
    if (!isRecord(wrapper) || !Array.isArray(wrapper.Sheet1)) {
      throw new Error(`Expected ${source}.json to contain a Sheet1 array.`)
    }

    wrapper.Sheet1.forEach((row, index) => {
      if (!isRecord(row)) {
        throw new Error(`Invalid row in ${source}.json at index ${index}.`)
      }
      sourceRows.push({ source, index, row })
    })
  }
  return sourceRows
}

function readRegionsConfig(config) {
  if (!isRecord(config) || !Array.isArray(config.regions)) {
    throw new Error('Expected config.json to contain a regions array.')
  }
  return config.regions.map((region) => {
    if (!isRecord(region)) {
      throw new Error('Invalid region entry in config.json.')
    }
    return region
  })
}

function findSubregionLabel(regionsConfig, sourceRegionId, sourceSubgroupId) {
  const region = regionsConfig.find((item) => item.id === sourceRegionId)
  if (!isRecord(region) || !Array.isArray(region.subgroups)) {
    throw new Error(`Missing region config for ${sourceRegionId}.`)
  }
  const subgroup = region.subgroups.find((item) => isRecord(item) && item.id === sourceSubgroupId)
  if (!isRecord(subgroup) || typeof subgroup.name !== 'string') {
    throw new Error(`Missing subgroup config for ${sourceRegionId}/${sourceSubgroupId}.`)
  }
  return subgroup.name
}

function makeUniqueMuscleId(row, region, duplicateNameCount, usedIds) {
  const baseId = slugify(row.Name)
    .replace(/^m-/, '')
    .replace(/^mm-/, '')
  const movementSuffix = slugify(splitList(row.Movements)[0] ?? '')
  const candidate =
    duplicateNameCount > 1 ? [baseId, region, row.subgroup, movementSuffix].filter(Boolean).join('-') : baseId
  let id = candidate
  let counter = 2
  while (usedIds.has(id)) {
    id = `${candidate}-${counter}`
    counter += 1
  }
  usedIds.add(id)
  return id
}

function mapRegionId(sourceRegionId) {
  const regionId = REGION_ID_MAP[sourceRegionId]
  if (!regionId) {
    throw new Error(`Unknown V1 region id: ${sourceRegionId}`)
  }
  return regionId
}

function extractImageRefs(row) {
  const refs = Array.isArray(row.Images) ? row.Images : row.Image ? [row.Image] : []
  return unique(refs.filter((ref) => typeof ref === 'string' && ref.trim()).map((ref) => ref.trim()))
}

function rewriteImageUrl(imageRef) {
  if (!imageRef.startsWith(IMAGE_PREFIX)) {
    throw new Error(`Unexpected image path: ${imageRef}`)
  }
  return `muscles/${imageRef.slice(IMAGE_PREFIX.length)}`
}

function inferImageView(imageRef, index) {
  const filename = path.basename(imageRef).toLowerCase()
  for (const [token, label] of Object.entries(VIEW_BY_TOKEN)) {
    if (filename.includes(`_${token}_`) || filename.includes(`_${token}.`)) {
      return label
    }
  }
  return `Ansicht ${index + 1}`
}

function normalizeAttribution(value) {
  if (!isRecord(value)) {
    throw new Error('Attribution must be an object.')
  }
  return {
    attribution: requireString(value.Author, 'Attribution.Author'),
    license: requireString(value.License, 'Attribution.License'),
    licenseUrl: optionalString(value.LicenseUrl),
    sourceUrl: optionalString(value.SourceUrl),
  }
}

function normalizeDifficulty(value) {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }
  throw new Error(`Invalid difficulty: ${String(value)}`)
}

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return unique(value.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))
}

function normalizeRichText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRichTextItem(item)).filter(Boolean).join('; ')
  }
  return normalizeRichTextItem(value)
}

function normalizeRichTextItem(value) {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (isRecord(value)) {
    const part = optionalString(value.Part)
    const location = optionalString(value.Location)
    if (part && location) {
      return `${part}: ${location}`
    }
    if (location) {
      return location
    }
    if (part) {
      return part
    }
    return JSON.stringify(value)
  }
  return String(value ?? '').trim()
}

function splitTopLevelCommas(value) {
  const parts = []
  let current = ''
  let depth = 0

  for (const char of String(value)) {
    if (char === '(') {
      depth += 1
    } else if (char === ')') {
      depth = Math.max(0, depth - 1)
    }

    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

function isSpinalSegment(value) {
  return /^(?:C|Th|T|L|S)\d+(?:\s*[–-]\s*(?:(?:C|Th|T|L|S)\d+|\d+))?$/.test(value.trim())
}

function normalizeSegment(value) {
  return value.trim().replace(/\s*-\s*/g, '–')
}

function extractSpinalSegments(value) {
  return unique(
    [...String(value).matchAll(/\b(?:C|Th|T|L|S)\d+(?:\s*[–-]\s*(?:(?:C|Th|T|L|S)\d+|\d+))?\b/g)].map(
      (match) => normalizeSegment(match[0]),
    ),
  )
}

function stripPureSegmentParentheses(value) {
  return value
    .replace(/\s*\(((?:C|Th|T|L|S)\d+(?:\s*[–-]\s*(?:(?:C|Th|T|L|S)\d+|\d+))?)\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function findUnusedImageFiles(sourceRoot, sourceRows) {
  const referenced = new Set(sourceRows.flatMap(({ row }) => extractImageRefs(row)))
  const imageRoot = path.join(sourceRoot, 'assets/images')
  const files = await listFiles(imageRoot)
  return files
    .filter((file) => /\.(?:jpe?g|png|webp|svg)$/i.test(file))
    .map((file) => `${IMAGE_PREFIX}${path.relative(imageRoot, file).split(path.sep).join('/')}`)
    .filter((imageRef) => !referenced.has(imageRef))
    .sort()
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function countBy(items, getKey) {
  const counts = {}
  for (const item of items) {
    const key = getKey(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function requireString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`)
  }
  return value.trim()
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function unique(values) {
  return [...new Set(values)]
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
