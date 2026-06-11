# Draft: _helpers/serve.status.route.helper.ts

Target: `tools/brioela-reading-gate/_helpers/serve.status.route.helper.ts`

```typescript
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { manifestPath, readTtlMs } from './gate.config.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import { createContentHash } from './create.content.hash.helper'
import { isFreshEntry } from './is.fresh.entry.helper'
import { readManifestEntries } from './read.manifest.entries.helper'
import type { ReadManifestEntry } from '../_types'

export async function serveStatusRoute(workspaceRoot: string): Promise<Response> {
  const entries = readManifestEntries(manifestPath)
  const currentEntries = new Map<string, ReadManifestEntry>()

  for (const entry of entries) {
    if (entry.workspaceRoot !== workspaceRoot) continue
    currentEntries.set(entry.file, entry)
  }

  if (currentEntries.size === 0) {
    return new Response('Reading gate: no recorded reads for this workspace yet.\n', { status: 200 })
  }

  const nowMs = readCurrentEpochMs()
  const entriesText: string[] = ['Reading gate — recorded reads:', '']

  for (const entry of currentEntries.values()) {
    entriesText.push(await formatEntryStatus(entry, workspaceRoot, nowMs))
  }

  entriesText.push('')
  return new Response(`${entriesText.join('\n')}\n`, { status: 200 })
}

async function formatEntryStatus(entry: ReadManifestEntry, workspaceRoot: string, nowMs: number): Promise<string> {
  if (!isFreshEntry(entry, nowMs, readTtlMs)) {
    return `  ✗ stale   ${entry.file}  (read ${Math.floor((nowMs - entry.readAtMs) / 60_000)}m ago — past ttl, read it again)`
  }

  const absolutePath = join(workspaceRoot, entry.file)

  if (!existsSync(absolutePath)) {
    return `  ✗ stale   ${entry.file}  (file no longer exists)`
  }

  const fileBytes = await Bun.file(absolutePath).arrayBuffer()

  if (createContentHash(fileBytes) !== entry.hash) {
    return `  ✗ stale   ${entry.file}  (file changed since read — read it again)`
  }

  return `  ✓ fresh   ${entry.file}  (read ${Math.floor((nowMs - entry.readAtMs) / 60_000)}m ago, sha256 ${entry.hash.slice(0, 8)})`
}
```
