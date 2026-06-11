#!/usr/bin/env bun
import { exit } from 'node:process'
import { realpathSync } from 'node:fs'
import { env } from 'node:process'
import { runTypeGuard } from '../brioela-type-guard/_helpers/run.type.guard.helper'
import { runNameGuard } from '../brioela-name-guard/_helpers/run.name.guard.helper'
import { formatGuardResults, type GuardResult, type FormattedViolation } from './_helpers/format.output.helper'
import type { TypeViolation } from '../brioela-type-guard/_types/type.violation.type'
import type { NamingViolation } from '../brioela-name-guard/_types/naming.violation.type'

const workspaceRoot = realpathSync(env.BRIOELA_WORKSPACE_ROOT ?? process.cwd())

function adaptType(v: TypeViolation): FormattedViolation {
	return { rule: v.rule, path: v.path, line: v.line, column: v.column, message: v.message, suggestion: v.suggestion }
}

function adaptNaming(v: NamingViolation): FormattedViolation {
	return { rule: v.rule, path: v.path, line: 0, column: 0, message: v.message, suggestion: v.suggestion }
}

const start = performance.now()

const [typeViolations, nameViolations] = await Promise.all([
	runTypeGuard(workspaceRoot, 'check'),
	runNameGuard(workspaceRoot, 'check'),
])

const elapsedMs = Math.round(performance.now() - start)

const results: GuardResult[] = [
	{ guard: 'name', violations: nameViolations.map(adaptNaming), durationMs: 0 },
	{ guard: 'type', violations: typeViolations.map(adaptType), durationMs: 0 },
]

process.stdout.write(formatGuardResults(results, null, elapsedMs))

exit(results.some((r) => r.violations.length > 0) ? 1 : 0)
