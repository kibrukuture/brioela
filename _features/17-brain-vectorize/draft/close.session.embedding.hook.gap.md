# Draft: close.session.embedding.hook.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/close.session.embedding.hook.ts`

**Gap (feature 17):** Fire-and-forget embed after **11** `closeSession` SQLite commit.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { embedAndStoreSessionVector } from '@/agents/brain/_executables/embed.and.store.session.executable'
import { logEmbeddingFailed } from '@/agents/brain/_repositories/log.embedding.failed.repository'

export type ScheduleSessionEmbeddingParams = {
	db: BrainDatabase
	env: Env
	userId: string
	sessionId: string
	outcomeSummary: string
	sessionType: string
	recipeId: string | null
	endedAt: number
	waitUntil: (promise: Promise<unknown>) => void
}

export function scheduleSessionEmbeddingOnClose(params: ScheduleSessionEmbeddingParams): void {
	const {
		db,
		env,
		userId,
		sessionId,
		outcomeSummary,
		sessionType,
		recipeId,
		endedAt,
		waitUntil,
	} = params

	waitUntil(
		embedAndStoreSessionVector({
			env,
			userId,
			sessionId,
			outcomeSummary,
			sessionType,
			recipeId,
			endedAt,
		}).catch((err) => logEmbeddingFailed(db, userId, sessionId, err)),
	)
}
```

**Integration (11):** At end of `close.session.handler.ts`, after session row update:

```typescript
scheduleSessionEmbeddingOnClose({
	db,
	env,
	userId,
	sessionId,
	outcomeSummary,
	sessionType: session.sessionType,
	recipeId: session.recipeId,
	endedAt: now,
	waitUntil: ctx.waitUntil.bind(ctx),
})
```

Session close must not await embedding completion.
