# Draft: read.session.tools.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/read.session.tools.repository.ts`

**Gap (feature 16):** Session read paths for `load_session_context` and `search_session_history`. May merge into **11** `read.user.session.repository.ts` when shipped — avoid duplicate logic.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, asc, desc, eq, gte, isNotNull, ne, sql } from '@/database/drizzle/_database'
import { getOne } from '@/database/drizzle/_database'
import { scheduledAlarms, sessions, userMemory, type BrainSession } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { SessionsFtsTable } from '@/agents/brain/_helpers/is.non.latin.query.helper'

export function readLastCompletedSessionForContext(
	database: BrainDatabase,
	userId: string,
	excludeSessionId: string,
): BrainSession | undefined {
	return getOne(
		database
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					eq(sessions.status, 'completed'),
					isNotNull(sessions.endedAt),
					ne(sessions.id, excludeSessionId),
				),
			)
			.orderBy(desc(sessions.endedAt))
			.limit(1),
	)
}

export function readRecentCompletedSessionOutcomes(
	database: BrainDatabase,
	userId: string,
	excludeSessionId: string,
	limit: number,
) {
	return database
		.select({
			id: sessions.id,
			sessionType: sessions.sessionType,
			outcomeSummary: sessions.outcomeSummary,
			endedAt: sessions.endedAt,
		})
		.from(sessions)
		.where(
			and(
				eq(sessions.userId, userId),
				eq(sessions.status, 'completed'),
				isNotNull(sessions.outcomeSummary),
				ne(sessions.id, excludeSessionId),
			),
		)
		.orderBy(desc(sessions.endedAt))
		.limit(limit)
		.all()
}

export function readLastAbandonedSession(
	database: BrainDatabase,
	userId: string,
	excludeSessionId: string,
) {
	return getOne(
		database
			.select({
				id: sessions.id,
				endedAt: sessions.endedAt,
				sessionType: sessions.sessionType,
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					eq(sessions.status, 'abandoned'),
					ne(sessions.id, excludeSessionId),
				),
			)
			.orderBy(desc(sessions.startedAt))
			.limit(1),
	)
}

export function listPendingAlarmsForSessionContext(database: BrainDatabase, userId: string) {
	return database
		.select({
			id: scheduledAlarms.id,
			alarmType: scheduledAlarms.alarmType,
			scheduledAt: scheduledAlarms.scheduledAt,
			payload: scheduledAlarms.payload,
		})
		.from(scheduledAlarms)
		.where(and(eq(scheduledAlarms.userId, userId), eq(scheduledAlarms.status, 'pending')))
		.orderBy(asc(scheduledAlarms.scheduledAt))
		.all()
}

export function listDistinctActiveMemoryNamespaces(database: BrainDatabase, userId: string): string[] {
	return database
		.selectDistinct({ namespace: userMemory.namespace })
		.from(userMemory)
		.where(and(eq(userMemory.userId, userId), eq(userMemory.isActive, true)))
		.orderBy(asc(userMemory.namespace))
		.all()
		.map((row) => row.namespace)
}

export type SearchSessionsOutcomeFtsParams = {
	ftsTable: SessionsFtsTable
	safeQuery: string
	sessionType?: 'chat' | 'cooking' | 'alarm' | 'background'
	sinceTimestamp?: number
	limit: number
}

export function searchSessionsOutcomeFts(
	database: BrainDatabase,
	userId: string,
	params: SearchSessionsOutcomeFtsParams,
) {
	const { ftsTable, safeQuery, sessionType, sinceTimestamp, limit } = params

	// ftsTable is validated enum — safe to interpolate table name only
	const ftsSql = ftsTable === 'sessions_fts_trigram' ? 'sessions_fts_trigram' : 'sessions_fts'

	return database.all<{
		id: string
		sessionType: string
		outcomeSummary: string
		recipeId: string | null
		endedAt: number | null
		model: string
	}>(
		sql`
			SELECT
				s.id as id,
				s.session_type as sessionType,
				s.outcome_summary as outcomeSummary,
				s.recipe_id as recipeId,
				s.ended_at as endedAt,
				s.model as model
			FROM sessions s
			INNER JOIN ${sql.raw(ftsSql)} f ON s.rowid = f.rowid
			WHERE f.outcome_summary MATCH ${safeQuery}
				AND s.user_id = ${userId}
				AND s.status = 'completed'
				AND s.outcome_summary IS NOT NULL
				${sessionType ? sql`AND s.session_type = ${sessionType}` : sql``}
				${sinceTimestamp ? sql`AND s.ended_at >= ${sinceTimestamp}` : sql``}
			ORDER BY s.ended_at DESC
			LIMIT ${limit}
		`,
	)
}
```

Export from `_repositories/index.ts` when shipped.

**Note:** `searchSessionsOutcomeFts` uses `sql.raw` for virtual table name only — table comes from `SessionsFtsTable` enum, not user input. MATCH query is parameterized.

**Overlap:** `listDistinctActiveMemoryNamespaces` duplicates **15** G11 — share one implementation.
