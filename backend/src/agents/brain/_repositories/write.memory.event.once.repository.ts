import { memoryEvent, type NewBrainMemoryEvent } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeMemoryEventOnce(db: BrainDatabase, input: NewBrainMemoryEvent): void {
	db
		.insert(memoryEvent)
		.values(input)
		.onConflictDoNothing({ target: memoryEvent.id })
		.run()
}
