# Draft: search.session.history.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_executables/search.session.history.executable.ts`

**Gap (feature 16):** FTS search over `sessions_fts*` per `implementable-specs/brioela-tools/17-search-session-history.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { searchSessionsOutcomeFts } from '@/agents/brain/_repositories/read.session.tools.repository'
import type { SearchSessionHistoryParams } from '@/agents/brain/_tools/_schemas/search.session.history.schema'
import { resolveSessionsFtsTable } from '@/agents/brain/_helpers/is.non.latin.query.helper'

function escapeFtsQuery(query: string): string {
	return query.replace(/["*^]/g, ' ').trim()
}

export const searchSessionHistoryExecutable = async (
	db: BrainDatabase,
	userId: string,
	params: SearchSessionHistoryParams,
) => {
	const safeQuery = escapeFtsQuery(params.query)
	const ftsTable = resolveSessionsFtsTable(params.query)
	const fetchLimit = params.limit * 2

	const rows = searchSessionsOutcomeFts(db, userId, {
		ftsTable,
		safeQuery,
		sessionType: params.session_type,
		sinceTimestamp: params.since_timestamp,
		limit: fetchLimit,
	})

	const results = rows.slice(0, params.limit).map((row) => ({
		id: row.id,
		session_type: row.sessionType,
		outcome_summary: row.outcomeSummary,
		recipe_id: row.recipeId,
		ended_at: row.endedAt,
	}))

	return {
		query: params.query,
		results,
		result_count: results.length,
		fts_table_used: ftsTable,
	}
}
```

Add to `_tools/_executables/index.ts`:

```typescript
export * from './search.session.history.executable'
```

**Note:** Over-fetch `limit * 2` then slice — matches spec intent for post-filter headroom. Join filter already applies `completed` + `user_id`.

**Compressed sessions:** Excluded by `status = 'completed'` in repository — see **G15**.
