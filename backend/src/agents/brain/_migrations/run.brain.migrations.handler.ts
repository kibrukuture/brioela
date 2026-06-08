import { nanoid } from 'nanoid'
import { applyDurableSqliteMigration } from '@/database/sqlite/_migrations'
import { brainMigrationBundle } from '@/agents/brain/_migrations/brain.migration'
import { readCurrentBrainMigration } from '@/agents/brain/_migrations/read.current.brain.migration.helper'
import { runBrainMigrationSmoke } from '@/agents/brain/_migrations/run.brain.migration.smoke.handler'
import { formatBrainMigrationError } from '@/agents/brain/_migrations/format.brain.migration.error.helper'
import {
	deleteBrainMigrationLock,
	readBrainMigrationLock,
	writeBrainMigrationLock,
	writeBrainMigrationRun,
	writeBrainMigrationRunStatus,
	writeBrainMigrationSmoke,
	writeBrainSchemaReadiness,
} from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import { BrainMigrationLockedError } from '@/agents/brain/_types'
import type { BrainMigrationJournalEntry, BrainMigrationReadiness } from '@/agents/brain/_migrations/brain.migration.schema'

const migrationLockTtlMs = 60_000

export async function runBrainMigrations(
	database: BrainDatabase,
	checkedAtEpochMs: number,
): Promise<BrainMigrationReadiness> {
	const migration = readCurrentBrainMigration(brainMigrationBundle.journal)
	const migrationRunId = nanoid(24)
	const deploymentId = createBrainMigrationDeploymentId(migration)

	let hasBrainMigrationLock = false
	let hasBrainMigrationRun = false

	try {
		await applyDurableSqliteMigration(database, brainMigrationBundle)

		writeBrainMigrationRun(database, {
			id: migrationRunId,
			migrationId: migration.tag,
			fromVersion: migration.idx,
			toVersion: migration.idx,
			phase: 'expand',
			risk: 'low',
			startedAt: checkedAtEpochMs,
			finishedAt: null,
			status: 'started',
			attempt: 1,
			errorJson: null,
			deploymentId,
		})
		hasBrainMigrationRun = true

		acquireBrainMigrationLock(database, migrationRunId, deploymentId, checkedAtEpochMs)
		hasBrainMigrationLock = true

		writeBrainSchemaReadiness(database, {
			id: 'brain',
			schemaVersion: migration.idx,
			minReadableVersion: migration.idx,
			targetVersion: migration.idx,
			status: 'migrating',
			lastMigrationId: migration.tag,
			lastSmokeStatus: null,
			lastErrorJson: null,
			updatedAt: checkedAtEpochMs,
		})

		writeBrainMigrationRunStatus(database, {
			id: migrationRunId,
			status: 'applied',
			finishedAt: checkedAtEpochMs,
			errorJson: null,
		})

		const readiness = runBrainMigrationSmoke(database, migration, migrationRunId, checkedAtEpochMs, checkedAtEpochMs)

		writeBrainMigrationRunStatus(database, {
			id: migrationRunId,
			status: 'smoke_passed',
			finishedAt: checkedAtEpochMs,
			errorJson: null,
		})

		deleteBrainMigrationLock(database)

		return readiness
	} catch (error) {
		const errorJson = formatBrainMigrationError(error)

		if (hasBrainMigrationRun) {
			writeBrainMigrationRunStatus(database, {
				id: migrationRunId,
				status: 'failed',
				finishedAt: checkedAtEpochMs,
				errorJson,
			})
			writeBrainMigrationSmoke(database, {
				id: nanoid(24),
				migrationRunId,
				smoke: 'brain.migration.runtime',
				status: 'failed',
				startedAt: checkedAtEpochMs,
				finishedAt: checkedAtEpochMs,
				errorJson,
			})
			writeBrainSchemaReadiness(database, {
				id: 'brain',
				schemaVersion: migration.idx,
				minReadableVersion: migration.idx,
				targetVersion: migration.idx,
				status: error instanceof BrainMigrationLockedError ? 'needs_retry' : 'migration_failed',
				lastMigrationId: migration.tag,
				lastSmokeStatus: 'failed',
				lastErrorJson: errorJson,
				updatedAt: checkedAtEpochMs,
			})
		}
		if (hasBrainMigrationLock) {
			deleteBrainMigrationLock(database)
		}

		return {
			status: error instanceof BrainMigrationLockedError ? 'needs_retry' : 'migration_failed',
			checkedAtEpochMs,
			verifiedEventCount: 0,
		}
	}
}

function acquireBrainMigrationLock(database: BrainDatabase, runId: string, deploymentId: string, startedAt: number): void {
	const migrationLock = readBrainMigrationLock(database)

	if (migrationLock !== null && migrationLock.expiresAt > startedAt) {
		throw new BrainMigrationLockedError()
	}

	writeBrainMigrationLock(
		database,
		{
			runId,
			deploymentId,
			startedAt,
			expiresAt: startedAt + migrationLockTtlMs,
		},
		startedAt,
	)
}

function createBrainMigrationDeploymentId(migration: BrainMigrationJournalEntry): string {
	return `brain-drizzle-${migration.tag}`
}
