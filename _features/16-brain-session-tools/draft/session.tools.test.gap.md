# Draft: session.tools.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/session.tools.test.ts`

**Gap (feature 16):** Automated tests per ledger **0006** verification plan (updated for correct FTS target).

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, test } from 'bun:test'
import { eq } from '@/database/drizzle/_database'
import { createDatabase } from '@/agents/brain/_database'
import { sessions, sessionTurns } from '@/agents/brain/_schemas'
import { loadSessionContextExecutable } from '@/agents/brain/_tools/_executables/load.session.context.executable'
import { searchSessionHistoryExecutable } from '@/agents/brain/_tools/_executables/search.session.history.executable'
import { nanoid } from 'nanoid'

function seedCompletedSession(
	db: ReturnType<typeof createDatabase>,
	userId: string,
	outcomeSummary: string,
	sessionType: 'chat' | 'cooking' = 'chat',
) {
	const id = nanoid(24)
	const now = Date.now()
	db.insert(sessions)
		.values({
			id,
			userId,
			sessionType,
			model: 'claude-sonnet-4-6',
			status: 'completed',
			outcomeSummary,
			startedAt: now - 60_000,
			endedAt: now,
			endReason: 'completed',
		})
		.run()
	return id
}

describe('session tools', () => {
	test('load_session_context returns empty history for first session', async () => {
		const storage = new DurableObjectState()
		const db = createDatabase(storage)
		const userId = 'user-a'
		const currentId = nanoid(24)
		db.insert(sessions)
			.values({
				id: currentId,
				userId,
				sessionType: 'chat',
				model: 'claude-sonnet-4-6',
				status: 'active',
				startedAt: Date.now(),
			})
			.run()

		const response = await loadSessionContextExecutable(db, userId, {
			current_session_id: currentId,
			limit_recent_sessions: 3,
		})

		expect(response.last_session).toBeNull()
		expect(response.recent_sessions).toEqual([])
		expect(Array.isArray(response.memory_namespaces)).toBe(true)
	})

	test('load_session_context returns last completed session excluding current', async () => {
		const storage = new DurableObjectState()
		const db = createDatabase(storage)
		const userId = 'user-a'
		const priorId = seedCompletedSession(db, userId, 'Cooked doro wat with grandma.')
		const currentId = nanoid(24)
		db.insert(sessions)
			.values({
				id: currentId,
				userId,
				sessionType: 'chat',
				model: 'claude-sonnet-4-6',
				status: 'active',
				startedAt: Date.now(),
			})
			.run()

		const response = await loadSessionContextExecutable(db, userId, {
			current_session_id: currentId,
			limit_recent_sessions: 3,
		})

		expect(response.last_session?.id).toBe(priorId)
		expect(response.recent_sessions.length).toBeGreaterThanOrEqual(1)
	})

	test('search_session_history finds outcome_summary via sessions_fts', async () => {
		const storage = new DurableObjectState()
		const db = createDatabase(storage)
		const userId = 'user-a'
		seedCompletedSession(db, userId, 'Cooked doro wat with berbere spice layering.')

		const response = await searchSessionHistoryExecutable(db, userId, {
			query: 'doro wat',
			limit: 5,
		})

		expect(response.result_count).toBeGreaterThanOrEqual(1)
		expect(response.fts_table_used).toBe('sessions_fts')
		expect(response.results[0].outcome_summary).toContain('doro')
	})

	test('search_session_history respects user isolation', async () => {
		const storage = new DurableObjectState()
		const db = createDatabase(storage)
		seedCompletedSession(db, 'user-a', 'User A cooked doro wat.')
		seedCompletedSession(db, 'user-b', 'User B cooked shiro wot.')

		const response = await searchSessionHistoryExecutable(db, 'user-a', {
			query: 'shiro',
			limit: 5,
		})

		expect(response.result_count).toBe(0)
	})

	test('search_session_history returns empty array for no matches', async () => {
		const storage = new DurableObjectState()
		const db = createDatabase(storage)
		const userId = 'user-a'
		seedCompletedSession(db, userId, 'Unrelated content only.')

		const response = await searchSessionHistoryExecutable(db, userId, {
			query: 'nonexistent-dish-xyz',
			limit: 5,
		})

		expect(response.results).toEqual([])
		expect(response.result_count).toBe(0)
	})
})
```

**Note:** Test harness must run migrations (FTS tables) before assertions — follow pattern in `run.migrations.handler.test.ts`. Adjust `DurableObjectState` / `createDatabase` imports to match project test utilities when implementing.

**Ledger drift:** Original **0006** tests expected `found: false` and `session_turns` excerpts — **reject**; use empty/null response shapes and `sessions_fts` per implementable specs.
