# Draft: tools/brioela-name-guard/_policies/validate.underscore.folder.policy.ts

Target: `tools/brioela-name-guard/_policies/validate.underscore.folder.policy.ts`

```
import { basename } from 'node:path'
import { allowedUnderscoreFolders, type WorkspaceEntry } from '../_helpers'
import type { NamingViolation } from '../_types'

export function validateUnderscoreFolder(entry: WorkspaceEntry, allEntries: WorkspaceEntry[]): NamingViolation[] {
  if (entry.kind !== 'directory') return []

  const folderName = basename(entry.repoPath)
  if (!allowedUnderscoreFolders.has(folderName)) return []

  const hasIndex = allEntries.some((candidate) => (
    candidate.kind === 'file'
    && candidate.repoPath === `${entry.repoPath}/index.ts`
  ))

  if (hasIndex) return []

  return [{
    rule: 'underscore-folder-index',
    path: entry.repoPath,
    message: 'Every underscore-scoped folder must contain index.ts.',
    suggestion: `Add ${entry.repoPath}/index.ts as a barrel export file.`,
  }]
}
```
