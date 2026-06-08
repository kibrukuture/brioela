import { env, runInDurableObject } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createBrainDatabase } from '@/agents/brain/_database'
import { brainMigrationBundle } from '@/agents/brain/_migrations/brain.migration'
import { readCurrentBrainMigration } from '@/agents/brain/_migrations/read.current.brain.migration.helper'
import { runBrainMigrations } from '@/agents/brain/_migrations'
import { readBrainMigrationLock, writeBrainMigrationLock } from '@/agents/brain/_repositories'
import { brainMigrationRuns, brainMigrationSmokeResults, brainSchemaReadiness } from '@/agents/brain/_schema'
import { desc, eq } from '@/database/drizzle/_database'

describe('Brain migration runtime', () => {
	it('boots a Brain object into ready schema state with persisted run and smoke records', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		const readiness = await brain.checkBrainReadiness()

		expect(readiness.readiness.status).toBe('ready')
		expect(readiness.readiness.verifiedEventCount).toBe(1)

		await runInDurableObject(brain, (_, state) => {
			const database = createBrainDatabase(state.storage)
			const migration = readCurrentBrainMigration(brainMigrationBundle.journal)
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
			expect(readBrainMigrationLock(database)).toBeNull()
		})
	})

	it('keeps migration reruns idempotent for an existing Brain object database', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		await brain.checkBrainReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createBrainDatabase(state.storage)
			const firstRunCount = database.select().from(brainMigrationRuns).all().length
			const checkedAtEpochMs = 2_000_000

			const readiness = await runBrainMigrations(database, checkedAtEpochMs)
			const secondRunCount = database.select().from(brainMigrationRuns).all().length
			const latestRun = database
				.select()
				.from(brainMigrationRuns)
				.where(eq(brainMigrationRuns.startedAt, checkedAtEpochMs))
				.get()

			expect(readiness.status).toBe('ready')
			expect(secondRunCount).toBe(firstRunCount + 1)
			expect(latestRun?.status).toBe('smoke_passed')
			expect(readBrainMigrationLock(database)).toBeNull()
		})
	})

	it('returns needs_retry while another migration lock is still live', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())

		await brain.checkBrainReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createBrainDatabase(state.storage)
			const startedAt = 3_000_000
			const expiresAt = startedAt + 60_000

			writeBrainMigrationLock(
				database,
				{
					runId: 'migration-run-held-by-another-worker',
					deploymentId: 'deployment-held-by-another-worker',
					startedAt,
					expiresAt,
				},
				startedAt,
			)

			const readiness = await runBrainMigrations(database, startedAt + 1)
			const migrationLock = readBrainMigrationLock(database)
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
})
