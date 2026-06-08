import type { NamingScope } from '../_types'

export function parseNamingScope(input: unknown, path: string): NamingScope {
  if (!input || typeof input !== 'object') {
    throw new Error(`${path} must contain a JSON object.`)
  }

  const value = input as Record<string, unknown>
  if (typeof value.scope !== 'string' || value.scope.length === 0) {
    throw new Error(`${path} must define a non-empty string scope.`)
  }

  return {
    scope: value.scope,
    allowedSubjects: parseOptionalStringArray(value.allowedSubjects, 'allowedSubjects', path),
    requiredSubject: typeof value.requiredSubject === 'boolean' ? value.requiredSubject : undefined,
    allowedActions: parseOptionalStringArray(value.allowedActions, 'allowedActions', path),
    allowedRoles: parseOptionalStringArray(value.allowedRoles, 'allowedRoles', path),
  }
}

function parseOptionalStringArray(value: unknown, key: string, path: string): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${path}.${key} must be an array of strings.`)
  }
  return value
}
