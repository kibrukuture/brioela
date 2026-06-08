import { basename } from 'node:path'
import { allowedStandaloneFiles, splitFileName, type LoadedNamingScope, type WorkspaceEntry } from '../_helpers'
import type { NamingViolation } from '../_types'

const roleSuffixes = new Set([
  'route',
  'controller',
  'handler',
	'helper',
	'repository',
	'rpc',
  'policy',
  'mapper',
  'prompt',
  'runtime',
  'middleware',
  'agent',
  'tool',
  'schema',
  'type',
  'event',
  'job',
  'routes',
  'lib',
  'constant',
  'store',
  'hook',
  'api',
  'client',
  'feature',
  'variants',
  'glsl',
  'test',
])

export function validateScopeSubject(entry: WorkspaceEntry, scope: LoadedNamingScope | undefined): NamingViolation[] {
  if (!scope || entry.kind !== 'file') return []

  const fileName = basename(entry.repoPath)
  if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx')) return []
  if (allowedStandaloneFiles.has(fileName)) return []
  if (fileName === 'naming.scope.json') return []

  const parsedName = parseTypeScriptFileName(fileName)
  const violations: NamingViolation[] = []

  if (!parsedName.role || !roleSuffixes.has(parsedName.role)) return violations

  if (scope.allowedRoles && !scope.allowedRoles.includes(parsedName.role)) {
    violations.push({
      rule: 'scope-role-not-allowed',
      path: entry.repoPath,
      message: `Role '${parsedName.role}' is not allowed inside scope '${scope.scope}'.`,
      suggestion: `Allowed roles here: ${scope.allowedRoles.join(', ')}.`,
    })
  }

  if (scope.allowedActions && parsedName.action && !scope.allowedActions.includes(parsedName.action)) {
    violations.push({
      rule: 'scope-action-not-allowed',
      path: entry.repoPath,
      message: `Action '${parsedName.action}' is not allowed inside scope '${scope.scope}'.`,
      suggestion: `Allowed actions here: ${scope.allowedActions.join(', ')}.`,
    })
  }

  const subject = parsedName.subject
  if (scope.requiredSubject && !subject) {
    violations.push({
      rule: 'scope-subject-required',
      path: entry.repoPath,
      message: `Files inside scope '${scope.scope}' must include an explicit subject before the role suffix.`,
      suggestion: `Use a name like {action}.${scope.scope}.${parsedName.role}.ts.`,
    })
  }

  if (subject && scope.allowedSubjects && !scope.allowedSubjects.includes(subject)) {
    violations.push({
      rule: 'scope-subject-not-allowed',
      path: entry.repoPath,
      message: `Subject '${subject}' is not allowed inside scope '${scope.scope}'.`,
      suggestion: `Allowed subjects here: ${scope.allowedSubjects.join(', ')}.`,
    })
  }

  return violations
}

function parseTypeScriptFileName(fileName: string): { action?: string; subject?: string; role?: string } {
  const { stem } = splitFileName(fileName)
  const parts = stem.split('.')
  const role = [...parts].reverse().find((part) => roleSuffixes.has(part))
  if (!role) return {}

  const roleIndex = parts.lastIndexOf(role)
  const beforeRole = parts.slice(0, roleIndex)
  const action = beforeRole[0]
  const subject = beforeRole.length >= 2 ? beforeRole[beforeRole.length - 1] : undefined

  return { action, subject, role }
}
