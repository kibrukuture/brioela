# Draft: get.shard.index.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/get.shard.index.helper.ts`

**Gap (feature 17):** FNV-1a shard routing per `implementable-specs/18-vectorize.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
export const SESSION_VECTOR_SHARD_COUNT = 20 as const

export function getShardIndex(userId: string): number {
	let hash = 2166136261
	for (let i = 0; i < userId.length; i++) {
		hash ^= userId.charCodeAt(i)
		hash = (hash * 16777619) >>> 0
	}
	return hash % SESSION_VECTOR_SHARD_COUNT
}

export function getSessionVectorIndexName(userId: string): string {
	return `brioela-sessions-${getShardIndex(userId)}`
}

export function getSessionVectorNamespace(userId: string): string {
	return userId
}
```

**Tests:** Same `userId` always same shard; shard in `[0, 19]`; different users distribute across shards (smoke test with sample UUIDs).
