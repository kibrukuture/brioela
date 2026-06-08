import { brainMigrationSmokeResults, type BrainMigrationSmoke, type NewBrainMigrationSmoke } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeBrainMigrationSmoke(database: BrainDatabase, migrationSmoke: NewBrainMigrationSmoke): BrainMigrationSmoke {
	return database.insert(brainMigrationSmokeResults).values(migrationSmoke).returning().get()
}
