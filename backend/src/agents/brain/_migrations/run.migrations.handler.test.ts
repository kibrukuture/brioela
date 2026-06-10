import { runInDurableObject } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { createDatabase } from '@/agents/brain/_database'
import { brainMigrationBundle } from '@/agents/brain/_migrations/brain.migration'
import { readCurrentMigration } from '@/agents/brain/_migrations/read.current.migration.helper'
import { runMigrations } from '@/agents/brain/_migrations'
import { readMigrationLock, writeMigrationLock } from '@/agents/brain/_repositories'
import {
	brainMigrationRuns,
	brainMigrationSmokeResults,
	brainSchemaReadiness,
	sessions,
	sessionTurns,
} from '@/agents/brain/_schemas'
import { desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

describe('Brain migration runtime', () => {
	it('boots a Brain object into ready schema state with persisted run and smoke records', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		const readiness = await brain.checkReadiness()

		expect(readiness.readiness.status).toBe('ready')
		expect(readiness.readiness.verifiedEventCount).toBe(1)

		await runInDurableObject(brain, (_, state) => {
			const database = createDatabase(state.storage)
			const migration = readCurrentMigration(brainMigrationBundle.journal)
			const storedReadiness = database
				.select()
				.from(brainSchemaReadiness)
				.where(eq(brainSchemaReadiness.id, 'brain'))
				.get()
			const migrationRun = database
				.select()
				.from(brainMigrationRuns)
				.orderBy(desc(brainMigrationRuns.startedAt))
				.limit(1)
				.get()
			const migrationSmoke = database
				.select()
				.from(brainMigrationSmokeResults)
				.orderBy(desc(brainMigrationSmokeResults.startedAt))
				.limit(1)
				.get()

			expect(storedReadiness?.status).toBe('ready')
			expect(storedReadiness?.lastMigrationId).toBe(migration.tag)
			expect(storedReadiness?.lastSmokeStatus).toBe('passed')
			expect(migrationRun?.status).toBe('smoke_passed')
			expect(migrationRun?.migrationId).toBe(migration.tag)
			expect(migrationSmoke?.status).toBe('passed')
			expect(migrationSmoke?.smoke).toBe('brain.memory.write')
			expect(readMigrationLock(database)).toBeNull()
		})
	})

	it('keeps migration reruns idempotent for an existing Brain object database', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const firstRunCount = database.select().from(brainMigrationRuns).all().length
			const checkedAtEpochMs = 2_000_000

			const readiness = await runMigrations(database, checkedAtEpochMs)
			const secondRunCount = database.select().from(brainMigrationRuns).all().length
			const latestRun = database
				.select()
				.from(brainMigrationRuns)
				.where(eq(brainMigrationRuns.startedAt, checkedAtEpochMs))
				.get()

			expect(readiness.status).toBe('ready')
			expect(secondRunCount).toBe(firstRunCount + 1)
			expect(latestRun?.status).toBe('smoke_passed')
			expect(readMigrationLock(database)).toBeNull()
		})
	})

	it('returns needs_retry while another migration lock is still live', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const startedAt = 3_000_000
			const expiresAt = startedAt + 60_000

			writeMigrationLock(
				database,
				{
					runId: 'migration-run-held-by-another-worker',
					deploymentId: 'deployment-held-by-another-worker',
					startedAt,
					expiresAt,
				},
				startedAt,
			)

			const readiness = await runMigrations(database, startedAt + 1)
			const migrationLock = readMigrationLock(database)
			const failedRun = database
				.select()
				.from(brainMigrationRuns)
				.where(eq(brainMigrationRuns.status, 'failed'))
				.orderBy(desc(brainMigrationRuns.startedAt))
				.limit(1)
				.get()

			expect(readiness.status).toBe('needs_retry')
			expect(migrationLock?.runId).toBe('migration-run-held-by-another-worker')
			expect(migrationLock?.expiresAt).toBe(expiresAt)
			expect(failedRun?.errorJson).toContain('BrainMigrationLockedError')
		})
	})

	it('synchronizes inserts, updates, and deletes to FTS5 and trigram tables via triggers', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		// Bootstrap migrations and readiness
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const userId = 'user-123'
			const sessionId = nanoid(24)

			// 1. Insert a session with Latin text
			database
				.insert(sessions)
				.values({
					id: sessionId,
					userId,
					sessionType: 'cooking',
					model: 'gemini-live',
					status: 'completed',
					outcomeSummary: 'We cooked a delicious doro wat recipe today.',
					startedAt: Date.now(),
				})
				.run()

			// 2. Query sessions_fts via MATCH (Latin search)
			interface FtsResult {
				id: string
				outcomeSummary: string
			}
			const latinFtsResult = database
				.all<FtsResult>(sql`
					SELECT s.id, s.outcome_summary as outcomeSummary
					FROM sessions s
					JOIN sessions_fts f ON s.rowid = f.rowid
					WHERE f.outcome_summary MATCH 'doro'
				`)
			expect(latinFtsResult.length).toBe(1)
			expect(latinFtsResult[0].id).toBe(sessionId)

			// 3. Update the session (modify outcomeSummary)
			database
				.update(sessions)
				.set({
					outcomeSummary: 'We cooked shiro wot instead.',
					endedAt: Date.now(),
				})
				.where(eq(sessions.id, sessionId))
				.run()

			// Assert old keyword 'doro' no longer matches, but new keyword 'shiro' matches
			const oldKeywordResult = database
				.all<FtsResult>(sql`
					SELECT s.id FROM sessions s
					JOIN sessions_fts f ON s.rowid = f.rowid
					WHERE f.outcome_summary MATCH 'doro'
				`)
			expect(oldKeywordResult.length).toBe(0)

			const newKeywordResult = database
				.all<FtsResult>(sql`
					SELECT s.id FROM sessions s
					JOIN sessions_fts f ON s.rowid = f.rowid
					WHERE f.outcome_summary MATCH 'shiro'
				`)
			expect(newKeywordResult.length).toBe(1)

			// 4. Insert session turn with Amharic/non-Latin text (trigram search test)
			const turnId = nanoid(24)
			database
				.insert(sessionTurns)
				.values({
					id: turnId,
					sessionId,
					userId,
					turnNumber: 1,
					role: 'user',
					content: 'በጣም የሚጣፍጥ ምግብ ነው', // "It is very delicious food"
					createdAt: Date.now(),
				})
				.run()

			// Query session_turns_fts_trigram via MATCH
			// trigram splits 'የሚጣፍጥ' into trigrams and matches substring
			const trigramResult = database
				.all<{ id: string }>(sql`
					SELECT t.id FROM session_turns t
					JOIN session_turns_fts_trigram f ON t.rowid = f.rowid
					WHERE f.content MATCH 'ጣፍጥ'
				`)
			expect(trigramResult.length).toBe(1)
			expect(trigramResult[0].id).toBe(turnId)

			// 5. Delete the session turn
			database.delete(sessionTurns).where(eq(sessionTurns.id, turnId)).run()

			// Assert search index is cleared
			const deletedResult = database
				.all<{ id: string }>(sql`
					SELECT t.id FROM session_turns t
					JOIN session_turns_fts_trigram f ON t.rowid = f.rowid
					WHERE f.content MATCH 'ጣፍጥ'
				`)
			expect(deletedResult.length).toBe(0)
		})
	})
})
