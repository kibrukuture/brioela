import { brainMigrationRuns, type BrainMigrationRun, type NewBrainMigrationRun } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq } from '@/database/drizzle/_database'

export function writeBrainMigrationRun(database: BrainDatabase, migrationRun: NewBrainMigrationRun): BrainMigrationRun {
	return database.insert(brainMigrationRuns).values(migrationRun).returning().get()
}

export function writeBrainMigrationRunStatus(
	database: BrainDatabase,
	migrationRun: Pick<BrainMigrationRun, 'id' | 'status' | 'finishedAt' | 'errorJson'>,
): BrainMigrationRun {
	return database
		.update(brainMigrationRuns)
		.set({
			status: migrationRun.status,
			finishedAt: migrationRun.finishedAt,
			errorJson: migrationRun.errorJson,
		})
		.where(eq(brainMigrationRuns.id, migrationRun.id))
		.returning()
		.get()
}
