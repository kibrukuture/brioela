import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { violationKey, type TypeViolation } from '../_types'

export const baselinePath = 'tools/brioela-type-guard/type.guard.baseline.json'

type BaselineFile = {
  version: 1
  generatedAt: string
  violations: TypeViolation[]
}

export async function loadBaseline(workspaceRoot: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(workspaceRoot, baselinePath), 'utf8')
    const parsed = parseBaselineFile(JSON.parse(raw))
    return new Set(parsed.violations.map(violationKey))
  } catch {
    return new Set()
  }
}

export async function writeBaseline(workspaceRoot: string, violations: TypeViolation[]): Promise<void> {
  const file: BaselineFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    violations: violations.sort((a, b) => violationKey(a).localeCompare(violationKey(b))),
  }

  await writeFile(join(workspaceRoot, baselinePath), `${JSON.stringify(file, null, 2)}\n`)
}

export function filterBaselineViolations(
  violations: TypeViolation[],
  baseline: Set<string>,
): TypeViolation[] {
  return violations.filter((violation) => !baseline.has(violationKey(violation)))
}

function parseBaselineFile(value: unknown): BaselineFile {
  if (!isBaselineFile(value)) {
    throw new Error('Invalid Brioela Type Guard baseline file.')
  }

  return value
}

function isBaselineFile(value: unknown): value is BaselineFile {
  if (typeof value !== 'object' || value === null) return false
  if (!hasOwn(value, 'version') || value.version !== 1) return false
  if (!hasOwn(value, 'generatedAt') || typeof value.generatedAt !== 'string') return false
  if (!hasOwn(value, 'violations') || !Array.isArray(value.violations)) return false
  return value.violations.every(isTypeViolation)
}

function isTypeViolation(value: unknown): value is TypeViolation {
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
