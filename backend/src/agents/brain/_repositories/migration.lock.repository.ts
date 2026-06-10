import { agentState } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { migrationLockSchema, type BrainMigrationLock } from '@/agents/brain/_migrations'
import { eq, getOne } from '@/database/drizzle/_database'

const migrationLockKey = 'schema.migration_lock'
const migrationLockOwnerId = 'migration'

export function readMigrationLock(database: BrainDatabase): BrainMigrationLock | null {
	const lockRecord = getOne(database.select().from(agentState).where(eq(agentState.key, migrationLockKey)))
	if (lockRecord === null) return null
	return migrationLockSchema.parse(JSON.parse(lockRecord.value))
}

export function writeMigrationLock(database: BrainDatabase, migrationLock: BrainMigrationLock, updatedAt: number): void {
	database
		.insert(agentState)
		.values({
			key: migrationLockKey,
			userId: migrationLockOwnerId,
			value: JSON.stringify(migrationLock),
			updatedAt,
		})
		.onConflictDoUpdate({
			target: agentState.key,
			set: {
				userId: migrationLockOwnerId,
				value: JSON.stringify(migrationLock),
				updatedAt,
			},
		})
		.run()
}

export function deleteMigrationLock(database: BrainDatabase): void {
	database.delete(agentState).where(eq(agentState.key, migrationLockKey)).run()
}
