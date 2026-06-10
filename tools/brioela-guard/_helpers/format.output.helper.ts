const R = '\x1b[31m'   // red
const G = '\x1b[32m'   // green
const Y = '\x1b[33m'   // yellow
const W = '\x1b[37m'   // white
const DIM = '\x1b[2m'  // dim
const B = '\x1b[1m'    // bold
const X = '\x1b[0m'    // reset

const WIDTH = 80

export type GuardResult = {
	guard: 'name' | 'type' | 'lexicon'
	violations: FormattedViolation[]
	durationMs: number
}

export type FormattedViolation = {
	rule: string
	path: string
	line: number
	column: number
	message: string
	suggestion?: string
}

function line(char = '─', width = WIDTH): string {
	return char.repeat(width)
}

function pad(s: string, width: number): string {
	return s.length >= width ? s : s + ' '.repeat(width - s.length)
}

const GUARD_LABEL: Record<string, string> = {
	name: 'name-guard   ',
	type: 'type-guard   ',
	lexicon: 'lexicon-guard',
}

export function formatGuardResults(
	results: GuardResult[],
	changedFile: string | null,
	elapsedMs: number,
): string {
	const lines: string[] = []
	const totalViolations = results.reduce((n, r) => n + r.violations.length, 0)

	lines.push('')
	lines.push(`${DIM}${line()}${X}`)

	if (changedFile) {
		lines.push(`${DIM}  changed  ${X}${W}${changedFile}${X}`)
		lines.push('')
	}

	for (const result of results) {
		const label = GUARD_LABEL[result.guard] ?? result.guard
		if (result.violations.length === 0) {
			lines.push(`  ${DIM}[${label}]${X}  ${G}✔ clean${X}`)
			continue
		}

		lines.push(`  ${B}${R}[${label}]${X}`)
		lines.push('')

		for (const v of result.violations) {
			const loc = `${v.path}:${v.line}:${v.column}`
			lines.push(`  ${R}${B}✖ VIOLATION — DO NOT COMMIT. FIX THIS NOW.${X}`)
			lines.push(`    ${W}${B}file${X}   ${loc}`)
			lines.push(`    ${W}${B}rule${X}   ${Y}${v.rule}${X}`)
			lines.push(`    ${W}${B}what${X}   ${v.message}`)
			if (v.suggestion) {
				lines.push(`    ${W}${B}fix${X}    ${G}${v.suggestion}${X}`)
			}
			lines.push('')
		}
	}

	lines.push(`${DIM}${line()}${X}`)

	const resultLine = results
		.map((r) => `  ${DIM}${GUARD_LABEL[r.guard]}${X}  ${r.violations.length > 0 ? `${R}${B}${r.violations.length} violation${r.violations.length !== 1 ? 's' : ''}${X}` : `${G}0${X}`}`)
		.join('\n')

	lines.push(resultLine)
	lines.push('')

	if (totalViolations > 0) {
		lines.push(`  ${R}${B}result   ${totalViolations} VIOLATION${totalViolations !== 1 ? 'S' : ''} — BLOCKED${X}`)
		lines.push('')
		lines.push(`  ${R}${B}THIS CODE DOES NOT MEET BRIOELA STANDARDS.${X}`)
		lines.push(`  ${R}${B}EVERY RULE EXISTS FOR A REASON. FIX ALL ${totalViolations} BEFORE CONTINUING.${X}`)
	} else {
		lines.push(`  ${G}${B}result   PASS — all guards clean${X}`)
	}

	lines.push(`  ${DIM}elapsed  ${elapsedMs}ms${X}`)
	lines.push(`${DIM}${line()}${X}`)
	lines.push('')

	return lines.join('\n')
}

export function formatStartup(watchRoots: string[]): string {
	const lines: string[] = []
	lines.push('')
	lines.push(`${DIM}${line()}${X}`)
	lines.push(`  ${B}brioela guard${X}  ${DIM}watch mode — FSEvents via @parcel/watcher${X}`)
	lines.push(`  ${DIM}watching  ${watchRoots.join('  ')}${X}`)
	lines.push(`  ${DIM}guards    name-guard · type-guard · lexicon-guard${X}`)
	lines.push(`${DIM}${line()}${X}`)
	lines.push('')
	return lines.join('\n')
}

export function formatFatalError(error: unknown): string {
	const msg = error instanceof Error ? error.message : String(error)
	return [
		'',
		`${R}${B}${line('═')}${X}`,
		`${R}${B}  GUARD CRASHED — THIS MUST NEVER HAPPEN${X}`,
		`${R}  ${msg}${X}`,
		`${R}${B}${line('═')}${X}`,
		'',
	].join('\n')
}
