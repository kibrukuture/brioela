export type NamingViolation = {
  rule: string
  path: string
  message: string
  suggestion?: string
}

export function violationKey(violation: NamingViolation): string {
  return `${violation.rule}::${violation.path}::${violation.message}`
}
