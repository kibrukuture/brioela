# Draft: read.user.session.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/read.user.session.repository.ts`

**Gap (feature 11):** No session read repository in production. Required by open/close handlers, compression (**13**), session tools (**16**), and active-session smoke (**04** G7).

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, asc, desc, eq, getOne, isNotNull, ne } from '@/database/drizzle/_database'
import { sessions, sessionTurns, type BrainSession, type BrainSessionTurn } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function readUserSession(
	database: BrainDatabase,
	sessionId: string,
	userId: string,
): BrainSession | undefined {
	return getOne(
		database
			.select()
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId))),
	)
}

export function readActiveUserSession(
	database: BrainDatabase,
	userId: string,
): BrainSession | undefined {
	return getOne(
		database
			.select()
			.from(sessions)
			.where(and(eq(sessions.userId, userId), eq(sessions.status, 'active')))
			.orderBy(desc(sessions.startedAt))
			.limit(1),
	)
}

export function readLastCompletedSession(
	database: BrainDatabase,
	userId: string,
	excludeSessionId?: string,
): BrainSession | undefined {
	const conditions = [
		eq(sessions.userId, userId),
		eq(sessions.status, 'completed'),
		isNotNull(sessions.endedAt),
	]
	if (excludeSessionId) {
		conditions.push(ne(sessions.id, excludeSessionId))
	}

	return getOne(
		database
			.select()
			.from(sessions)
			.where(and(...conditions))
			.orderBy(desc(sessions.endedAt))
			.limit(1),
	)
}

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
```

Export from `_repositories/index.ts` when shipped.

**16** may add FTS helpers in same file or `search.session.history.executable.ts`.
