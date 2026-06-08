import { basename } from 'node:path'
import { readFileSync } from 'node:fs'
import type { WorkspaceEntry } from '../_helpers'
import type { NamingViolation } from '../_types'

const allowedIndexLinePattern = /^(export\s+(?:\*|\{[^}]*\})\s+from\s+['"][^'"]+['"];?|export\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?|\/\/.*|\s*)$/

export function validateIndexBarrel(entry: WorkspaceEntry): NamingViolation[] {
  if (entry.kind !== 'file') return []
  if (basename(entry.repoPath) !== 'index.ts') return []

  const content = readFileSync(entry.absolutePath, 'utf8')
  const invalidLineNumber = content
    .split('\n')
    .findIndex((line) => !allowedIndexLinePattern.test(line.trim()))

  if (invalidLineNumber === -1) return []

  return [{
    rule: 'index-barrel-only',
    path: entry.repoPath,
    message: `index.ts must be barrel-only; line ${invalidLineNumber + 1} contains logic or unsupported syntax.`,
    suggestion: 'Move logic to a role-suffixed file and export it from index.ts.',
  }]
}
