# Draft: _helpers/parse.manifest.entry.helper.test.ts

Target: `tools/brioela-reading-gate/_helpers/parse.manifest.entry.helper.test.ts`

```typescript
import { describe, expect, test } from 'bun:test'
import { formatManifestEntry } from './format.manifest.entry.helper'
import { parseManifestEntry } from './parse.manifest.entry.helper'
import type { ReadManifestEntry } from '../_types'

const entry: ReadManifestEntry = {
  file: 'backend/src/agents/brain/_schemas/constraint.schema.ts',
  hash: 'a'.repeat(64),
  bytes: 2048,
  readAtMs: 1_000_000,
  workspaceRoot: '/Users/test/brioela',
}

describe('parseManifestEntry', () => {
  test('format then parse returns the same entry', () => {
    expect(parseManifestEntry(formatManifestEntry(entry))).toEqual(entry)
  })

  test('rejects malformed text', () => {
    expect(parseManifestEntry('')).toBeNull()
    expect(parseManifestEntry('only\ttwo')).toBeNull()
    expect(parseManifestEntry('abc\thash\t12\t/root\tfile.ts')).toBeNull()
    expect(parseManifestEntry('1000\thash\t-5\t/root\tfile.ts')).toBeNull()
  })
})
```
