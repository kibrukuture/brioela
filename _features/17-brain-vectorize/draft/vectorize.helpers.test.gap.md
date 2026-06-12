# Draft: vectorize.helpers.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/vectorize.helpers.test.ts`

**Gap (feature 17):** Unit tests for shard routing and embed helper validation.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, test } from 'bun:test'
import {
	getShardIndex,
	getSessionVectorIndexName,
	SESSION_VECTOR_SHARD_COUNT,
} from '@/agents/brain/_helpers/get.shard.index.helper'

describe('getShardIndex', () => {
	test('returns stable shard for same userId', () => {
		const userId = '550e8400-e29b-41d4-a716-446655440000'
		expect(getShardIndex(userId)).toBe(getShardIndex(userId))
	})

	test('shard is within range 0..19', () => {
		const ids = [
			'550e8400-e29b-41d4-a716-446655440000',
			'6ba7b810-9dad-11d1-80b4-00c04fd430c8',
			'00000000-0000-4000-8000-000000000001',
		]
		for (const id of ids) {
			const shard = getShardIndex(id)
			expect(shard).toBeGreaterThanOrEqual(0)
			expect(shard).toBeLessThan(SESSION_VECTOR_SHARD_COUNT)
		}
	})

	test('index name matches shard', () => {
		const userId = '550e8400-e29b-41d4-a716-446655440000'
		const shard = getShardIndex(userId)
		expect(getSessionVectorIndexName(userId)).toBe(`brioela-sessions-${shard}`)
	})
})
```

Add integration tests in `semantic.search.sessions.test.ts` with mocked `Vectorize` binding and mocked Cohere fetch when Brain test harness supports env injection.

Run: `cd backend && bun test src/agents/brain/_helpers/vectorize.helpers.test.ts`
