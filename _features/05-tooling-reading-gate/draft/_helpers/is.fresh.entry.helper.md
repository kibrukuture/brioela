# Draft: _helpers/is.fresh.entry.helper.ts

Target: `tools/brioela-reading-gate/_helpers/is.fresh.entry.helper.ts`

```typescript
import type { ReadManifestEntry } from '../_types'

export function isFreshEntry(entry: ReadManifestEntry, nowMs: number, ttlMs: number): boolean {
  return nowMs - entry.readAtMs < ttlMs
}
```
