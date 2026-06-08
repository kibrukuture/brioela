import type { BrainDatabase } from '@/agents/brain/_database'
import { and, desc, eq, lt, or } from '@/database/drizzle/_database'
import { memoryEvent, type BrainMemoryEvent } from '@/agents/brain/_schema'
import type { BrainMemoryEventCursor, BrainMemoryEventFilter, BrainMemoryEventPage } from '@/agents/brain/_types'

export function listBrainMemoryEvents(
	database: BrainDatabase,
	memoryEventFilter: BrainMemoryEventFilter,
): BrainMemoryEventPage {
	if (memoryEventFilter.cursor === null) {
		const memoryEvents = database
			.select()
			.from(memoryEvent)
			.orderBy(desc(memoryEvent.capturedAt), desc(memoryEvent.id))
			.limit(memoryEventFilter.limit)
			.all()

		return { events: memoryEvents, nextCursor: createNextBrainMemoryEventCursor(memoryEvents) }
	}

	const memoryEvents = database
		.select()
		.from(memoryEvent)
		.where(
			or(
				lt(memoryEvent.capturedAt, memoryEventFilter.cursor.capturedAt),
				and(
					eq(memoryEvent.capturedAt, memoryEventFilter.cursor.capturedAt),
					lt(memoryEvent.id, memoryEventFilter.cursor.id),
				),
			),
		)
		.orderBy(desc(memoryEvent.capturedAt), desc(memoryEvent.id))
		.limit(memoryEventFilter.limit)
		.all()

	return { events: memoryEvents, nextCursor: createNextBrainMemoryEventCursor(memoryEvents) }
}

function createNextBrainMemoryEventCursor(memoryEvents: BrainMemoryEvent[]): BrainMemoryEventCursor | null {
	return memoryEvents.reduce<BrainMemoryEventCursor | null>(
		(cursor, memoryEvent) => ({
			capturedAt: memoryEvent.capturedAt,
			id: memoryEvent.id,
		}),
		null,
	)
}
