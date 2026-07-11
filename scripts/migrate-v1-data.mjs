#!/usr/bin/env node

import path from 'node:path'
import { migrateV1Data } from './lib/v1-migration.mjs'

const args = parseArgs(process.argv.slice(2))
const repoRoot = process.cwd()

const sourceRoot =
  args.source ??
  process.env.MUSKELFINDER_V1_SOURCE ??
  path.resolve(repoRoot, '../Muskelfinder')

const dataOut = args['data-out'] ?? path.resolve(repoRoot, 'src/data/generated')
const publicOut = args['public-out'] ?? path.resolve(repoRoot, 'public/muscles')
const reportOut = args['report-out'] ?? path.resolve(repoRoot, 'src/data/generated/migration-report.json')

try {
  const result = await migrateV1Data({ sourceRoot, dataOut, publicOut, reportOut })
  console.log(`Migrated ${result.muscles.length} muscles from ${path.relative(repoRoot, sourceRoot) || sourceRoot}.`)
  console.log(`Copied ${result.report.counts.copiedImages} image files to ${path.relative(repoRoot, publicOut)}.`)
  console.log(`Wrote data files to ${path.relative(repoRoot, dataOut)}.`)
  if (result.report.segmentNotes.length > 0) {
    console.log(`Segment report contains ${result.report.segmentNotes.length} note(s).`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

function parseArgs(rawArgs) {
  const parsed = {}
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index]
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }
    const key = arg.slice(2)
    const value = rawArgs[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    parsed[key] = value
    index += 1
  }
  return parsed
}
