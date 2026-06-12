# Draft: load.session.context.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_executables/load.session.context.executable.ts`

**Gap (feature 16):** Execute path for five bounded reads per `implementable-specs/brioela-tools/16-load-session-context.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import {
	listDistinctActiveMemoryNamespaces,
	listPendingAlarmsForSessionContext,
	readLastAbandonedSession,
	readLastCompletedSessionForContext,
	readRecentCompletedSessionOutcomes,
} from '@/agents/brain/_repositories/read.session.tools.repository'
import type { LoadSessionContextParams } from '@/agents/brain/_tools/_schemas/load.session.context.schema'
import { jsonValueSchema } from '@brioela/shared/zod'

function parseAlarmPayload(raw: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(raw)
		const validated = jsonValueSchema.parse(parsed)
		if (typeof validated === 'object' && validated !== null && !Array.isArray(validated)) {
			return validated as Record<string, unknown>
		}
		return { value: validated }
	} catch {
		return { raw }
	}
}

export const loadSessionContextExecutable = async (
	db: BrainDatabase,
	userId: string,
	params: LoadSessionContextParams,
) => {
	const lastSessionRow = readLastCompletedSessionForContext(db, userId, params.current_session_id)
	const recentRows = readRecentCompletedSessionOutcomes(
		db,
		userId,
		params.current_session_id,
		params.limit_recent_sessions,
	)
	const pendingAlarmRows = listPendingAlarmsForSessionContext(db, userId)
	const namespaces = listDistinctActiveMemoryNamespaces(db, userId)
	const abandonedRow = readLastAbandonedSession(db, userId, params.current_session_id)

	return {
		last_session: lastSessionRow
			? {
					id: lastSessionRow.id,
					session_type: lastSessionRow.sessionType,
					outcome_summary: lastSessionRow.outcomeSummary,
					recipe_id: lastSessionRow.recipeId,
					ended_at: lastSessionRow.endedAt,
					end_reason: lastSessionRow.endReason,
					model: lastSessionRow.model,
				}
			: null,
		recent_sessions: recentRows.map((row) => ({
			id: row.id,
			session_type: row.sessionType,
			outcome_summary: row.outcomeSummary,
			ended_at: row.endedAt,
		})),
		pending_alarms: pendingAlarmRows.map((row) => ({
			id: row.id,
			alarm_type: row.alarmType,
			scheduled_at: row.scheduledAt,
			payload: parseAlarmPayload(row.payload),
		})),
		last_abandoned_session: abandonedRow
			? {
					id: abandonedRow.id,
					ended_at: abandonedRow.endedAt,
					session_type: abandonedRow.sessionType,
				}
			: null,
		memory_namespaces: namespaces,
	}
}
```

Add to `_tools/_executables/index.ts`:

```typescript
export * from './load.session.context.executable'
```

**Optional strict check (G19):** Verify `params.current_session_id` belongs to `userId` via `readUserSession` before reads — throw if missing.
