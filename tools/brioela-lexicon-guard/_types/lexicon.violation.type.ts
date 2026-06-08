export type LexiconViolation = {
  rule: string
  path: string
  line: number
  column: number
  message: string
  suggestion?: string
}

export function lexiconViolationKey(violation: LexiconViolation): string {
  return [
    violation.rule,
    violation.path,
    violation.line,
    violation.column,
    violation.message,
  ].join('::')
}
