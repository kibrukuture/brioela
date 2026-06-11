import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeMemoryEvent } from '@/agents/brain/_repositories'
import type { z } from '@brioela/shared/zod'
import type { logMemoryEventSchema } from '@/agents/brain/_tools/_schemas/log.memory.event.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export const logMemoryEventExecutable = async (
	database: BrainDatabase,
	userId: string,
	activeSessionId: string | null = null,
	memoryEvent: z.infer<typeof logMemoryEventSchema>,
) => {
	const id = createId()
	const now = readCurrentEpochMs()

	writeMemoryEvent(database, {
		id,
		userId,
		kind: memoryEvent.kind,
		payloadJson: JSON.stringify(memoryEvent.payload),
		capturedAt: memoryEvent.captured_at ?? now,
		ingestedAt: now,
		source: memoryEvent.source,
		sessionId: activeSessionId,
		entityKind: memoryEvent.entity_kind ?? null,
		entityId: memoryEvent.entity_id ?? null,
		geoHash: memoryEvent.geo_hash ?? null,
	})

	return {
		id,
		status: 'logged',
	}
}
