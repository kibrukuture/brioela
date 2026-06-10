#!/usr/bin/env bun
import { readFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { env } from 'node:process'
import { writeBaseline as writeTypeBaseline } from '../brioela-type-guard/_helpers/baseline.helper'
import { writeBaseline as writeNameBaseline } from '../brioela-name-guard/_helpers/baseline.helper'
import { writeBaseline as writeLexiconBaseline } from '../brioela-lexicon-guard/_helpers/baseline.helper'
import type { TypeViolation } from '../brioela-type-guard/_types/type.violation.type'
import type { NamingViolation } from '../brioela-name-guard/_types/naming.violation.type'
import type { LexiconViolation } from '../brioela-lexicon-guard/_types/lexicon.violation.type'

const workspaceRoot = realpathSync(env.BRIOELA_WORKSPACE_ROOT ?? process.cwd())

type LegacyV1<T> = { version: 1; violations: T[] }

async function readLegacy<T>(relPath: string): Promise<T[]> {
	try {
		const raw = await readFile(join(workspaceRoot, relPath), 'utf8')
		const parsed = JSON.parse(raw) as LegacyV1<T>
		// accept v1 legacy format only — v2 is already migrated
		if (parsed.version !== 1) return []
		return parsed.violations ?? []
	} catch {
		console.log(`  skipped (not found or already v2): ${relPath}`)
		return []
	}
}

console.log('\nbrioela-guard: migrating baselines v1 → v2 (key-only format)\n')

const [typeViolations, nameViolations, lexiconViolations] = await Promise.all([
	readLegacy<TypeViolation>('tools/brioela-type-guard/type.guard.baseline.json'),
	readLegacy<NamingViolation>('tools/brioela-name-guard/name.guard.baseline.json'),
	readLegacy<LexiconViolation>('tools/brioela-lexicon-guard/lexicon.guard.baseline.json'),
])

await Promise.all([
	writeTypeBaseline(workspaceRoot, typeViolations),
	writeNameBaseline(workspaceRoot, nameViolations),
	writeLexiconBaseline(workspaceRoot, lexiconViolations),
])

console.log(`  type-guard    ${typeViolations.length} violations → type.guard.baseline.json`)
console.log(`  name-guard    ${nameViolations.length} violations → name.guard.baseline.json`)
console.log(`  lexicon-guard ${lexiconViolations.length} violations → lexicon.guard.baseline.json`)
console.log('\n  done. 3 files. run: bun run lock')
