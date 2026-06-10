import { brainMigrationRuns, type BrainMigrationRun, type NewBrainMigrationRun } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq, getReturned } from '@/database/drizzle/_database'

export function writeMigrationRun(database: BrainDatabase, migrationRun: NewBrainMigrationRun): BrainMigrationRun {
	return getReturned(database.insert(brainMigrationRuns).values(migrationRun).returning())
}

export function writeMigrationRunStatus(
	database: BrainDatabase,
	migrationRun: Pick<BrainMigrationRun, 'id' | 'status' | 'finishedAt' | 'errorJson'>,
): BrainMigrationRun {
	return getReturned(
		database
			.update(brainMigrationRuns)
			.set({
				status: migrationRun.status,
				finishedAt: migrationRun.finishedAt,
				errorJson: migrationRun.errorJson,
			})
			.where(eq(brainMigrationRuns.id, migrationRun.id))
			.returning(),
	)
}
