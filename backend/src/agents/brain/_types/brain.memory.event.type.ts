import type { BrainMemoryEvent } from '@/agents/brain/_schemas'

export interface BrainMemoryEventCursor {
	capturedAt: number
	id: string
}

export interface BrainMemoryEventFilter {
	limit: number
	cursor: BrainMemoryEventCursor | null
}

export interface BrainMemoryEventPage {
	events: BrainMemoryEvent[]
	nextCursor: BrainMemoryEventCursor | null
}
