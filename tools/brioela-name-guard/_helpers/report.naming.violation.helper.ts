import type { NamingViolation } from '../_types'

export function formatNamingViolations(violations: NamingViolation[]): string {
  if (violations.length === 0) return 'Brioela Name Guard: clean.\n'

  const lines = [
    '',
    `Brioela Name Guard found ${violations.length} violation${violations.length === 1 ? '' : 's'}.`,
    '',
  ]

  for (const violation of violations) {
    lines.push('NOMENCLATURE ERROR')
    lines.push(`Rule: ${violation.rule}`)
    lines.push(`File: ${violation.path}`)
    lines.push(`Reason: ${violation.message}`)
    if (violation.suggestion) lines.push(`Suggested fix: ${violation.suggestion}`)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}
