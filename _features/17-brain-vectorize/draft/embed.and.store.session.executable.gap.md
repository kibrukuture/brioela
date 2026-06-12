# Draft: embed.and.store.session.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_executables/embed.and.store.session.executable.ts`

**Gap (feature 17):** Embed `outcome_summary` and upsert to correct shard/namespace.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { embedText } from '@/agents/brain/_helpers/embed.text.helper'
import { getSessionVectorNamespace } from '@/agents/brain/_helpers/get.shard.index.helper'
import { getVectorIndex } from '@/agents/brain/_helpers/get.vector.index.helper'
import { buildSessionVectorMetadata } from '@/agents/brain/_schemas/session.vector.metadata.schema'

export type EmbedAndStoreSessionVectorParams = {
	env: Env
	userId: string
	sessionId: string
	outcomeSummary: string
	sessionType: string
	recipeId: string | null
	endedAt: number
}

export async function embedAndStoreSessionVector(
	params: EmbedAndStoreSessionVectorParams,
): Promise<void> {
	const { env, userId, sessionId, outcomeSummary, sessionType, recipeId, endedAt } = params

	const vector = await embedText(outcomeSummary, 'search_document', env)
	const index = getVectorIndex(userId, env)
	const namespace = getSessionVectorNamespace(userId)
	const metadata = buildSessionVectorMetadata({ sessionType, endedAt, recipeId })

	await index.upsert([
		{
			id: sessionId,
			values: vector,
			namespace,
			metadata,
		},
	])
}
```

Called from `close.session.embedding.hook.ts` and `reembed.session.on.compress.executable.ts`.

**Idempotent:** Upsert by `sessionId` overwrites prior vector (compression re-embed).
