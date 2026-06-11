# Draft: _helpers/create.content.hash.helper.test.ts

Target: `tools/brioela-reading-gate/_helpers/create.content.hash.helper.test.ts`

```typescript
import { describe, expect, test } from 'bun:test'
import { createContentHash } from './create.content.hash.helper'

describe('createContentHash', () => {
  test('same bytes give the same hash, different bytes differ', () => {
    const first = new TextEncoder().encode('export const sessions = sqliteTable(...)')
    const second = new TextEncoder().encode('export const sessions = sqliteTable(!!!)')

    expect(createContentHash(first.buffer)).toBe(createContentHash(first.buffer))
    expect(createContentHash(first.buffer)).not.toBe(createContentHash(second.buffer))
    expect(createContentHash(first.buffer)).toHaveLength(64)
  })
})
```
