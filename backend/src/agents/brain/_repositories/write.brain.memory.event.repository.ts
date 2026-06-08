import { memoryEvent, type BrainMemoryEvent } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMemoryEventWrite } from '@/agents/brain/_types'

export function writeBrainMemoryEvent(
	database: BrainDatabase,
	memoryEventWrite: BrainMemoryEventWrite,
): BrainMemoryEvent {
	return database
		.insert(memoryEvent)
		.values(memoryEventWrite)
		.returning()
		.get()
}
