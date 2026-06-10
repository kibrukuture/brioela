import { nanoid } from 'nanoid'
import { applyDurableSqliteMigration } from '@/database/sqlite/_migrations'
import { brainMigrationBundle } from '@/agents/brain/_migrations/brain.migration'
import { readCurrentMigration } from '@/agents/brain/_migrations/read.current.brain.migration.helper'
import { runMigrationSmoke } from '@/agents/brain/_migrations/run.brain.migration.smoke.handler'
import { formatMigrationError } from '@/agents/brain/_migrations/format.brain.migration.error.helper'
import {
	deleteMigrationLock,
	readMigrationLock,
	writeMigrationLock,
	writeMigrationRun,
	writeMigrationRunStatus,
	writeMigrationSmoke,
	writeSchemaReadiness,
} from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import { BrainMigrationLockedError } from '@/agents/brain/_types'
import type { BrainMigrationJournalEntry, BrainMigrationReadiness } from '@/agents/brain/_migrations/brain.migration.schema'

const migrationLockTtlMs = 60_000

export async function runMigrations(
	database: BrainDatabase,
	checkedAtEpochMs: number,
): Promise<BrainMigrationReadiness> {
	const migration = readCurrentMigration(brainMigrationBundle.journal)
	const migrationRunId = nanoid(24)
	const deploymentId = createMigrationDeploymentId(migration)

	let hasMigrationLock = false
	let hasMigrationRun = false

	try {
		await applyDurableSqliteMigration(database, brainMigrationBundle)

		writeMigrationRun(database, {
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
		hasMigrationRun = true

		acquireMigrationLock(database, migrationRunId, deploymentId, checkedAtEpochMs)
		hasMigrationLock = true

		writeSchemaReadiness(database, {
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

		writeMigrationRunStatus(database, {
			id: migrationRunId,
			status: 'applied',
			finishedAt: checkedAtEpochMs,
			errorJson: null,
		})

		const readiness = runMigrationSmoke(database, migration, migrationRunId, checkedAtEpochMs, checkedAtEpochMs)

		writeMigrationRunStatus(database, {
			id: migrationRunId,
			status: 'smoke_passed',
			finishedAt: checkedAtEpochMs,
			errorJson: null,
		})

		deleteMigrationLock(database)

		return readiness
	} catch (error) {
		const errorJson = formatMigrationError(error)

		if (hasMigrationRun) {
			writeMigrationRunStatus(database, {
				id: migrationRunId,
				status: 'failed',
				finishedAt: checkedAtEpochMs,
				errorJson,
			})
			writeMigrationSmoke(database, {
				id: nanoid(24),
				migrationRunId,
				smoke: 'brain.migration.runtime',
				status: 'failed',
				startedAt: checkedAtEpochMs,
				finishedAt: checkedAtEpochMs,
				errorJson,
			})
			writeSchemaReadiness(database, {
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
		if (hasMigrationLock) {
			deleteMigrationLock(database)
		}

		return {
			status: error instanceof BrainMigrationLockedError ? 'needs_retry' : 'migration_failed',
			checkedAtEpochMs,
			verifiedEventCount: 0,
		}
	}
}

function acquireMigrationLock(database: BrainDatabase, runId: string, deploymentId: string, startedAt: number): void {
	const migrationLock = readMigrationLock(database)

	if (migrationLock !== null && migrationLock.expiresAt > startedAt) {
		throw new BrainMigrationLockedError()
	}

	writeMigrationLock(
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

function createMigrationDeploymentId(migration: BrainMigrationJournalEntry): string {
	return `brain-drizzle-${migration.tag}`
}
