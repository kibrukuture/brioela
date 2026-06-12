# Draft: write.user.session.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/write.user.session.repository.ts`

**Gap (feature 11):** No session write repository in production.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { eq, getReturned, sql } from '@/database/drizzle/_database'
import { sessions, type BrainSession, type NewBrainSession } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function insertUserSession(
	database: BrainDatabase,
	values: NewBrainSession,
): BrainSession {
	return getReturned(
		database
			.insert(sessions)
			.values(values)
			.returning(),
	)
}

type CompleteUserSessionInput = {
	status: 'completed'
	outcomeSummary: string
	endedAt: number
	endReason: string
}

export function completeUserSession(
	database: BrainDatabase,
	sessionId: string,
	input: CompleteUserSessionInput,
): BrainSession {
	return getReturned(
		database
			.update(sessions)
			.set({
				status: input.status,
				outcomeSummary: input.outcomeSummary,
				endedAt: input.endedAt,
				endReason: input.endReason,
			})
			.where(eq(sessions.id, sessionId))
			.returning(),
	)
}

type AbandonUserSessionInput = {
	outcomeSummary: string
	endedAt: number
	endReason: 'timeout'
}

export function abandonUserSession(
	database: BrainDatabase,
	sessionId: string,
	input: AbandonUserSessionInput,
): BrainSession {
	return getReturned(
		database
			.update(sessions)
			.set({
				status: 'abandoned',
				outcomeSummary: input.outcomeSummary,
				endedAt: input.endedAt,
				endReason: input.endReason,
			})
			.where(eq(sessions.id, sessionId))
			.returning(),
	)
}

/** Fire-and-forget increments during live session — **20** calls these. */
export function incrementSessionTurnCount(
	database: BrainDatabase,
	sessionId: string,
	delta: number,
): void {
	database
		.update(sessions)
		.set({ turnCount: sql`${sessions.turnCount} + ${delta}` })
		.where(eq(sessions.id, sessionId))
		.run()
}
```

Compression status update (`compressed`) lives in **13** handler or extends this repository.
