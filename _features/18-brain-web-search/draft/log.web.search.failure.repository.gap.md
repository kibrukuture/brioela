# Draft: log.web.search.failure.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/log.web.search.failure.repository.ts`

**Gap (feature 18):** Upsert `agent_state` diagnostic row on provider failure per `implementable-specs/brioela-tools/18-search-web.md` + `11-agent-state.md` pattern.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { agentState } from '@/agents/brain/_schemas'
import { sql } from '@/database/drizzle/_database'
import { readCurrentEpochMs } from '@/time/_helpers'

export type WebSearchFailureRecord = {
	query: string
	provider: 'tavily' | 'exa'
	error: string
	ts: number
}

export function logWebSearchFailure(
	database: BrainDatabase,
	userId: string,
	sessionId: string,
	record: WebSearchFailureRecord,
): void {
	const now = readCurrentEpochMs()
	const key = `web_search.failure.${sessionId}`

	database
		.insert(agentState)
		.values({
			key,
			userId,
			value: JSON.stringify(record),
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: agentState.key,
			set: {
				value: sql`excluded.value`,
				updatedAt: now,
			},
		})
		.run()
}
```

Add to `_repositories/index.ts`:

```typescript
export * from './log.web.search.failure.repository'
```
