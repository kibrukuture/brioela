import { memoryEvent, type NewBrainMemoryEvent } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeBrainMemoryEventOnce(db: BrainDatabase, input: NewBrainMemoryEvent): void {
	db
		.insert(memoryEvent)
		.values(input)
		.onConflictDoNothing({ target: memoryEvent.id })
		.run()
}
