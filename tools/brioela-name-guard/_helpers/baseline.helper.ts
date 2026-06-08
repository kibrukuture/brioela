import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { violationKey, type NamingViolation } from '../_types'

export const baselinePath = 'tools/brioela-name-guard/name.guard.baseline.json'

type BaselineFile = {
  version: 1
  generatedAt: string
  violations: NamingViolation[]
}

export async function loadBaseline(workspaceRoot: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(workspaceRoot, baselinePath), 'utf8')
    const parsed = JSON.parse(raw) as BaselineFile
    return new Set(parsed.violations.map(violationKey))
  } catch {
    return new Set()
  }
}

export async function writeBaseline(workspaceRoot: string, violations: NamingViolation[]): Promise<void> {
  const file: BaselineFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    violations: violations.sort((a, b) => violationKey(a).localeCompare(violationKey(b))),
  }

  await writeFile(join(workspaceRoot, baselinePath), `${JSON.stringify(file, null, 2)}\n`)
}

export function filterBaselineViolations(
  violations: NamingViolation[],
  baseline: Set<string>,
): NamingViolation[] {
  return violations.filter((violation) => !baseline.has(violationKey(violation)))
}
