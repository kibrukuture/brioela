# Draft: _helpers/format.manifest.entry.helper.ts

Target: `tools/brioela-reading-gate/_helpers/format.manifest.entry.helper.ts`

```typescript
import type { ReadManifestEntry } from '../_types'

export function formatManifestEntry(entry: ReadManifestEntry): string {
  return [
    String(entry.readAtMs),
    entry.hash,
    String(entry.bytes),
    entry.workspaceRoot,
    entry.file,
  ].join('\t')
}
```
