import { eq, getReturned } from '@/database/drizzle/_database'
import { sql } from '@/database/sqlite/_schema'
import { userMemory, type BrainUserMemory, type NewBrainUserMemory } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeUserMemory(
	database: BrainDatabase,
	newMemory: NewBrainUserMemory,
): BrainUserMemory {
	return getReturned(
		database
			.insert(userMemory)
			.values(newMemory)
			.onConflictDoUpdate({
				target: userMemory.id,
				set: {
					value: newMemory.value,
					confidence: newMemory.confidence,
					source: newMemory.source,
					writeCount: sql`write_count + 1`,
					lastWrite: newMemory.lastWrite,
					updatedAt: newMemory.updatedAt,
				},
			})
			.returning(),
	)
}

export function incrementUserMemoryRead(
	database: BrainDatabase,
	id: string,
	timestamp: number,
): void {
	database
		.update(userMemory)
		.set({
			readCount: sql`read_count + 1`,
			lastRead: timestamp,
		})
		.where(eq(userMemory.id, id))
		.run()
}
