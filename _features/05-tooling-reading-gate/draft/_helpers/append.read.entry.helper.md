# Draft: _helpers/append.read.entry.helper.ts

Target: `tools/brioela-reading-gate/_helpers/append.read.entry.helper.ts`

```typescript
import { appendFileSync } from 'node:fs'
import { formatManifestEntry } from './format.manifest.entry.helper'
import type { ReadManifestEntry } from '../_types'

export function appendReadEntry(manifestPath: string, entry: ReadManifestEntry): void {
  appendFileSync(manifestPath, `${formatManifestEntry(entry)}\n`, { mode: 0o600 })
}
```
