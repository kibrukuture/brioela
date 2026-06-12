# Draft: reembed.session.on.compress.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_executables/reembed.session.on.compress.executable.ts`

**Gap (feature 17):** Re-embed when **13** rewrites `outcome_summary` on compression.

Per `implementable-specs/18-vectorize.md` Session Compressed section.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { embedAndStoreSessionVector } from '@/agents/brain/_executables/embed.and.store.session.executable'
import { logEmbeddingFailed } from '@/agents/brain/_repositories/log.embedding.failed.repository'

export type ReembedSessionOnCompressParams = {
	db: BrainDatabase
	env: Env
	userId: string
	sessionId: string
	compressionSummary: string
	sessionType: string
	recipeId: string | null
	endedAt: number
	waitUntil?: (promise: Promise<unknown>) => void
}

export function scheduleReembedSessionOnCompress(params: ReembedSessionOnCompressParams): void {
	const run = () =>
		embedAndStoreSessionVector({
			env: params.env,
			userId: params.userId,
			sessionId: params.sessionId,
			outcomeSummary: params.compressionSummary,
			sessionType: params.sessionType,
			recipeId: params.recipeId,
			endedAt: params.endedAt,
		}).catch((err) => logEmbeddingFailed(params.db, params.userId, params.sessionId, err))

	if (params.waitUntil) {
		params.waitUntil(run())
	} else {
		void run()
	}
}
```

**Note:** Same `sessionId` — upsert overwrites. Compression may store JSON in SQLite `outcome_summary`; embed the **text used for semantic recall** (compression summary prose or stringified JSON per **13** product decision — prefer human-readable summary field from compressor output if available).

**Blocked by:** **13** compression handler shipping.
