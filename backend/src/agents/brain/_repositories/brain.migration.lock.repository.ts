import { agentState } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'
import { brainMigrationLockSchema, type BrainMigrationLock } from '@/agents/brain/_migrations'
import { eq } from '@/database/drizzle/_database'

const brainMigrationLockKey = 'brain_schema.migration_lock'
const brainMigrationLockOwnerId = 'brain'

export function readBrainMigrationLock(database: BrainDatabase): BrainMigrationLock | null {
	const lockRecord = database.select().from(agentState).where(eq(agentState.key, brainMigrationLockKey)).get()

	if (!lockRecord) {
		return null
	}

	return brainMigrationLockSchema.parse(JSON.parse(lockRecord.value))
}

export function writeBrainMigrationLock(database: BrainDatabase, migrationLock: BrainMigrationLock, updatedAt: number): void {
	database
		.insert(agentState)
		.values({
			key: brainMigrationLockKey,
			userId: brainMigrationLockOwnerId,
			value: JSON.stringify(migrationLock),
			updatedAt,
		})
		.onConflictDoUpdate({
			target: agentState.key,
			set: {
				userId: brainMigrationLockOwnerId,
				value: JSON.stringify(migrationLock),
				updatedAt,
			},
		})
		.run()
}

export function deleteBrainMigrationLock(database: BrainDatabase): void {
	database.delete(agentState).where(eq(agentState.key, brainMigrationLockKey)).run()
}
