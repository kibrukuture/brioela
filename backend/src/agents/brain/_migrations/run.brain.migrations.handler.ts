import { applyDurableSqliteMigration } from '@/database/sqlite/_migrations'
import { brainMigrationBundle } from '@/agents/brain/_migrations/brain.migration'
import { readCurrentBrainMigration } from '@/agents/brain/_migrations/read.current.brain.migration.helper'
import { runBrainMigrationSmoke } from '@/agents/brain/_migrations/run.brain.migration.smoke.handler'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMigrationReadiness } from '@/agents/brain/_migrations/brain.migration.schema'

export async function runBrainMigrations(
	database: BrainDatabase,
	checkedAtEpochMs: number,
): Promise<BrainMigrationReadiness> {
	await applyDurableSqliteMigration(database, brainMigrationBundle)
	return runBrainMigrationSmoke(database, readCurrentBrainMigration(brainMigrationBundle.journal), checkedAtEpochMs)
}
