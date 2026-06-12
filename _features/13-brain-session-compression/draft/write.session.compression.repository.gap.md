# Draft: write.session.compression.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/write.session.compression.repository.ts`

**Gap (feature 13):** Write helpers for marking old session compressed and inserting continuation row. Watchdog cancel/schedule stays in handler (**13**) calling **09**/**11** alarm repos.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { eq } from 'drizzle-orm'
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { sessions, type BrainSession, type NewBrainSession } from '@/agents/brain/_schemas'
import type { CompressionSummary } from '@/agents/brain/_schemas/compression.summary.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export type MarkSessionCompressedInput = {
	sessionId: string
	summary: CompressionSummary
}

export function markSessionCompressed(database: BrainDatabase, input: MarkSessionCompressedInput): void {
	const now = readCurrentEpochMs()
	database
		.update(sessions)
		.set({
			status: 'compressed',
			outcomeSummary: JSON.stringify(input.summary),
			endedAt: now,
			endReason: 'compressed',
		})
		.where(eq(sessions.id, input.sessionId))
		.run()
}

export function insertContinuationSession(
	database: BrainDatabase,
	oldSession: BrainSession,
): { newSessionId: string } {
	const now = readCurrentEpochMs()
	const newSessionId = createId()

	const row: NewBrainSession = {
		id: newSessionId,
		userId: oldSession.userId,
		sessionType: oldSession.sessionType,
		parentSessionId: oldSession.id,
		recipeId: oldSession.recipeId,
		alarmType: null,
		status: 'active',
		outcomeSummary: null,
		model: oldSession.model,
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		estimatedCostUsd: null,
		turnCount: 0,
		skillsCreated: 0,
		constraintsProposed: 0,
		memoryWrites: 0,
		startedAt: now,
		endedAt: null,
		endReason: null,
	}

	database.insert(sessions).values(row).run()
	return { newSessionId }
}

/** Transaction wrapper — prefer single transaction in applyCompression. */
export function applySessionCompressionWrites(
	database: BrainDatabase,
	oldSessionId: string,
	summary: CompressionSummary,
): { newSessionId: string; oldSession: BrainSession } {
	const oldSession = database.select().from(sessions).where(eq(sessions.id, oldSessionId)).get()
	if (!oldSession) {
		throw new Error('session_not_found')
	}
	if (oldSession.status !== 'active') {
		throw new Error('session_not_active')
	}

	return database.transaction((tx) => {
		markSessionCompressed(tx, { sessionId: oldSessionId, summary })
		const { newSessionId } = insertContinuationSession(tx, oldSession)
		return { newSessionId, oldSession }
	})
}
```

**Reject build-guide drift:** no `compressionSummary` column; no `sessionType: 'chat'` hardcode; no `wasCompressed` flag.

Source: `implementable-specs/17-session-lifecycle.md` lines 154–201.
