import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { InvalidLexiconBaselineError, lexiconViolationKey, type LexiconViolation } from '../_types'

export const baselinePath = 'tools/brioela-lexicon-guard/lexicon.guard.baseline.json'

type BaselineFile = {
  version: 1
  generatedAt: string
  violations: LexiconViolation[]
}

export async function loadBaseline(workspaceRoot: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(workspaceRoot, baselinePath), 'utf8')
    const parsed = parseBaselineFile(JSON.parse(raw))
    return new Set(parsed.violations.map(lexiconViolationKey))
  } catch (error) {
    if (error instanceof InvalidLexiconBaselineError) throw error
    return new Set()
  }
}

export async function writeBaseline(workspaceRoot: string, violations: LexiconViolation[]): Promise<void> {
  const file: BaselineFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    violations: violations.sort((a, b) => lexiconViolationKey(a).localeCompare(lexiconViolationKey(b))),
  }

  await writeFile(join(workspaceRoot, baselinePath), `${JSON.stringify(file, null, 2)}\n`)
}

export function filterBaselineViolations(violations: LexiconViolation[], baseline: Set<string>): LexiconViolation[] {
  return violations.filter((violation) => !baseline.has(lexiconViolationKey(violation)))
}

function parseBaselineFile(value: unknown): BaselineFile {
  if (!isBaselineFile(value)) {
    throw new InvalidLexiconBaselineError()
  }

  return value
}

function isBaselineFile(value: unknown): value is BaselineFile {
  if (typeof value !== 'object' || value === null) return false
  if (!hasOwn(value, 'version') || value.version !== 1) return false
  if (!hasOwn(value, 'generatedAt') || typeof value.generatedAt !== 'string') return false
  if (!hasOwn(value, 'violations') || !Array.isArray(value.violations)) return false
  return value.violations.every(isLexiconViolation)
}

function isLexiconViolation(value: unknown): value is LexiconViolation {
  if (typeof value !== 'object' || value === null) return false
  if (!hasOwn(value, 'rule') || typeof value.rule !== 'string') return false
  if (!hasOwn(value, 'path') || typeof value.path !== 'string') return false
  if (!hasOwn(value, 'line') || typeof value.line !== 'number') return false
  if (!hasOwn(value, 'column') || typeof value.column !== 'number') return false
  if (!hasOwn(value, 'message') || typeof value.message !== 'string') return false
  if (hasOwn(value, 'suggestion') && typeof value.suggestion !== 'string') return false
  return true
}

function hasOwn<T extends string>(value: object, key: T): value is Record<T, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key)
}
