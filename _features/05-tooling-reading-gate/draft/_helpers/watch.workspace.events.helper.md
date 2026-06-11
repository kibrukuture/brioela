# Draft: _helpers/watch.workspace.events.helper.ts

Target: `tools/brioela-reading-gate/_helpers/watch.workspace.events.helper.ts`

```typescript
import watcher from '@parcel/watcher'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { appendGateEvent } from './append.gate.event.helper'

const watchRoots = [
  'backend',
  'shared',
  'mobile',
  'build-guide',
  'implementable-specs',
  'brioela-specs',
  '_records',
  'tools',
]

const ignoredParts = ['node_modules', 'dist', 'build', '.wrangler', '.expo', '.turbo', 'coverage', '.git']

function isIgnoredPath(path: string): boolean {
  return ignoredParts.some((part) => path.includes(`/${part}/`) || path.endsWith(`/${part}`))
}

export function watchWorkspaceEvents(workspaceRoot: string, apply: (changedPath: string) => void): void {
  const pending = new Set<string>()
  let checkAt: ReturnType<typeof setTimeout> | null = null

  function addPending(changedPath: string): void {
    pending.add(changedPath)
    if (checkAt) clearTimeout(checkAt)
    checkAt = setTimeout(() => {
      const first = [...pending][0] ?? ''
      pending.clear()
      apply(first)
    }, 250)
  }

  function mountRoot(root: string): void {
    const rootPath = join(workspaceRoot, root)

    if (!existsSync(rootPath)) {
      setTimeout(() => mountRoot(root), 30_000)
      return
    }

    watcher
      .subscribe(rootPath, (mountError, events) => {
        if (mountError) {
          appendGateEvent(`watch error in ${root}: ${mountError.message}`)
          return
        }
        for (const entry of events) {
          if (isIgnoredPath(entry.path)) continue
          addPending(entry.path.startsWith(`${workspaceRoot}/`) ? entry.path.slice(workspaceRoot.length + 1) : entry.path)
        }
      }, { ignore: ignoredParts.map((part) => `**/${part}/**`) })
      .catch((mountError: Error) => {
        appendGateEvent(`watch mount failed for ${root}: ${mountError.message} — retrying in 30s`)
        setTimeout(() => mountRoot(root), 30_000)
      })
  }

  for (const root of watchRoots) mountRoot(root)
}
```
