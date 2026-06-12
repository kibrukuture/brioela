# Draft: read.session.compression.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/read.session.compression.repository.ts`

**Gap (feature 13):** Read helpers for compression orchestration. May merge into `read.user.session.repository.ts` (**11**) when that ships — keep compression-specific queries here until **11** repos land.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { asc, desc, eq } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import { sessions, sessionTurns, type BrainSession, type BrainSessionTurn } from '@/agents/brain/_schemas'

export function readSessionTurnsOrdered(
	database: BrainDatabase,
	sessionId: string,
): BrainSessionTurn[] {
	return database
		.select()
		.from(sessionTurns)
		.where(eq(sessionTurns.sessionId, sessionId))
		.orderBy(asc(sessionTurns.turnNumber))
		.all()
}

export function readLastSessionTurns(
	database: BrainDatabase,
	sessionId: string,
	limit: number,
): BrainSessionTurn[] {
	const rows = database
		.select()
		.from(sessionTurns)
		.where(eq(sessionTurns.sessionId, sessionId))
		.orderBy(desc(sessionTurns.turnNumber))
		.limit(limit)
		.all()

	return rows.sort((a, b) => a.turnNumber - b.turnNumber)
}

export function getFullSessionChain(database: BrainDatabase, sessionId: string): BrainSession[] {
	const chain: BrainSession[] = []
	let currentId: string | null = sessionId

	while (currentId) {
		const session = database.select().from(sessions).where(eq(sessions.id, currentId)).get()
		if (!session) break
		chain.unshift(session)
		currentId = session.parentSessionId
	}

	return chain
}

export function readSessionCompressionCounters(
	database: BrainDatabase,
	sessionId: string,
): Pick<BrainSession, 'inputTokens' | 'turnCount' | 'sessionType' | 'status'> | undefined {
	return database
		.select({
			inputTokens: sessions.inputTokens,
			turnCount: sessions.turnCount,
			sessionType: sessions.sessionType,
			status: sessions.status,
		})
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.get()
}
```

Source: `implementable-specs/17-session-lifecycle.md` lines 86, 208, 249–266; `implementable-specs/08-session-turns.md` read rules.
