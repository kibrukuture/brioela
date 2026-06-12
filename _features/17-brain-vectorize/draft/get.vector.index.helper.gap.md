# Draft: get.vector.index.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/get.vector.index.helper.ts`

**Gap (feature 17):** Resolve `SESSIONS_VEC_{n}` binding from `Env` per shard.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { getShardIndex } from '@/agents/brain/_helpers/get.shard.index.helper'

type SessionVectorBindingKey =
	| 'SESSIONS_VEC_0'
	| 'SESSIONS_VEC_1'
	| 'SESSIONS_VEC_2'
	| 'SESSIONS_VEC_3'
	| 'SESSIONS_VEC_4'
	| 'SESSIONS_VEC_5'
	| 'SESSIONS_VEC_6'
	| 'SESSIONS_VEC_7'
	| 'SESSIONS_VEC_8'
	| 'SESSIONS_VEC_9'
	| 'SESSIONS_VEC_10'
	| 'SESSIONS_VEC_11'
	| 'SESSIONS_VEC_12'
	| 'SESSIONS_VEC_13'
	| 'SESSIONS_VEC_14'
	| 'SESSIONS_VEC_15'
	| 'SESSIONS_VEC_16'
	| 'SESSIONS_VEC_17'
	| 'SESSIONS_VEC_18'
	| 'SESSIONS_VEC_19'

function sessionVectorBindingKey(shard: number): SessionVectorBindingKey {
	return `SESSIONS_VEC_${shard}` as SessionVectorBindingKey
}

export function getVectorIndex(userId: string, env: Env): Vectorize {
	const shard = getShardIndex(userId)
	const key = sessionVectorBindingKey(shard)
	const index = env[key]
	if (!index) {
		throw new Error(`Missing Vectorize binding ${key} for user shard ${shard}`)
	}
	return index
}
```

**Env:** Requires all 20 bindings declared in `wrangler.jsonc` — see `worker.env.vectorize.bindings.gap.md`.
