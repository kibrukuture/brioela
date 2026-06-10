#!/usr/bin/env bun
import watcher from '@parcel/watcher'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { env, stdout } from 'node:process'
import { runTypeGuard } from '../brioela-type-guard/_helpers/run.type.guard.helper'
import { runNameGuard } from '../brioela-name-guard/_helpers/run.name.guard.helper'
import { runLexiconGuard } from '../brioela-lexicon-guard/_helpers/run.lexicon.guard.helper'
import {
	formatFatalError,
	formatGuardResults,
	formatStartup,
	type FormattedViolation,
	type GuardResult,
} from './_helpers/format.output.helper'
import type { LexiconViolation } from '../brioela-lexicon-guard/_types/lexicon.violation.type'
import type { NamingViolation } from '../brioela-name-guard/_types/naming.violation.type'
import type { TypeViolation } from '../brioela-type-guard/_types/type.violation.type'

const workspaceRoot = realpathSync(env.BRIOELA_WORKSPACE_ROOT ?? process.cwd())

// Union of all guard checked roots
const watchRoots = [
	'backend',
	'shared',
	'mobile',
	'build-guide',
	'implementable-specs',
	'brioela-specs',
	'_records',
	'tools',
]

const ignored = ['node_modules', 'dist', 'build', '.wrangler', '.expo', '.turbo', 'coverage', 'baselines']

// ─── adapters ─────────────────────────────────────────────────────────────────

function adaptType(v: TypeViolation): FormattedViolation {
	return { rule: v.rule, path: v.path, line: v.line, column: v.column, message: v.message, suggestion: v.suggestion }
}

function adaptNaming(v: NamingViolation): FormattedViolation {
	return { rule: v.rule, path: v.path, line: 0, column: 0, message: v.message, suggestion: v.suggestion }
}

function adaptLexicon(v: LexiconViolation): FormattedViolation {
	return { rule: v.rule, path: v.path, line: v.line, column: v.column, message: v.message, suggestion: v.suggestion }
}

// ─── check ────────────────────────────────────────────────────────────────────

async function runAllGuards(changedFile: string | null): Promise<void> {
	const start = performance.now()

	try {
		const [typeViolations, nameViolations, lexiconViolations] = await Promise.all([
			runTypeGuard(workspaceRoot, 'check'),
			runNameGuard(workspaceRoot, 'check'),
			runLexiconGuard(workspaceRoot, 'check'),
		])

		const elapsedMs = Math.round(performance.now() - start)

		const results: GuardResult[] = [
			{ guard: 'name', violations: nameViolations.map(adaptNaming), durationMs: 0 },
			{ guard: 'type', violations: typeViolations.map(adaptType), durationMs: 0 },
			{ guard: 'lexicon', violations: lexiconViolations.map(adaptLexicon), durationMs: 0 },
		]

		stdout.write(formatGuardResults(results, changedFile, elapsedMs))
	} catch (error) {
		stdout.write(formatFatalError(error))
	}
}

// ─── debounce ─────────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingChangedFile: string | null = null

function scheduleCheck(changedFile: string | null): void {
	pendingChangedFile = changedFile
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(() => {
		void runAllGuards(pendingChangedFile)
	}, 200)
}

// ─── startup ─────────────────────────────────────────────────────────────────

stdout.write(formatStartup(watchRoots))
void runAllGuards(null)

// ─── subscribe ───────────────────────────────────────────────────────────────

for (const root of watchRoots) {
	watcher
		.subscribe(
			join(workspaceRoot, root),
			(err, events) => {
				if (err) {
					stdout.write(formatFatalError(err))
					return
				}

				const tsEvent = events.find((e) => e.path.endsWith('.ts') || e.path.endsWith('.tsx'))
				if (!tsEvent) return

				const repoPath = tsEvent.path.startsWith(workspaceRoot + '/')
					? tsEvent.path.slice(workspaceRoot.length + 1)
					: tsEvent.path

				scheduleCheck(repoPath)
			},
			{ ignore: ignored },
		)
		.catch(() => {
			// Root doesn't exist yet — skip silently
		})
}
