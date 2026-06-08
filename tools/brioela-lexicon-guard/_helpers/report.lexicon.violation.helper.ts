import type { LexiconViolation } from '../_types'

export function formatLexiconViolations(violations: LexiconViolation[]): string {
  if (violations.length === 0) return 'Brioela Lexicon Guard: clean.\n'

  const lines = [
    '',
    `Brioela Lexicon Guard found ${violations.length} violation${violations.length === 1 ? '' : 's'}.`,
    '',
  ]

  for (const violation of violations) {
    lines.push('LEXICON ERROR')
    lines.push(`Rule: ${violation.rule}`)
    lines.push(`File: ${violation.path}:${violation.line}:${violation.column}`)
    lines.push(`Reason: ${violation.message}`)
    if (violation.suggestion) lines.push(`Required fix: ${violation.suggestion}`)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}
