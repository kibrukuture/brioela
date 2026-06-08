export type TypeViolation = {
  rule: string
  path: string
  line: number
  column: number
  message: string
  suggestion?: string
}

export function violationKey(violation: TypeViolation): string {
  return [
    violation.rule,
    violation.path,
    violation.line,
    violation.column,
    violation.message,
  ].join('::')
}
