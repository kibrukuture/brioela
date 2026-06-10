import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { violationKey, type NamingViolation } from '../_types'

type BaselineFile = { version: 2; keys: string[] }

const baselinePath = (root: string) => join(root, 'tools/brioela-name-guard/name.guard.baseline.json')

export async function loadBaseline(workspaceRoot: string): Promise<Set<string>> {
	try {
		const raw = await readFile(baselinePath(workspaceRoot), 'utf8')
		const parsed = JSON.parse(raw) as BaselineFile
		if (parsed.version !== 2) return new Set()
		return new Set(parsed.keys)
	} catch {
		return new Set()
	}
}

export async function writeBaseline(workspaceRoot: string, violations: NamingViolation[]): Promise<void> {
	const file: BaselineFile = { version: 2, keys: violations.map(violationKey).sort() }
	await writeFile(baselinePath(workspaceRoot), `${JSON.stringify(file, null, 2)}\n`)
}

export function filterBaselineViolations(
	violations: NamingViolation[],
	baseline: Set<string>,
): NamingViolation[] {
	return violations.filter((v) => !baseline.has(violationKey(v)))
}
