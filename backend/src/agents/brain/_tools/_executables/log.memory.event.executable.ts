import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeMemoryEvent } from '@/agents/brain/_repositories'
import type { z } from '@brioela/shared/zod'
import type { logMemoryEventSchema } from '@/agents/brain/_tools/_schemas/log.memory.event.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export async function logMemoryEventExecute(
	db: BrainDatabase,
	userId: string,
	activeSessionId: string | null = null,
	eventParams: z.infer<typeof logMemoryEventSchema>,
) {
	const id = createId()
	const now = readCurrentEpochMs()

	writeMemoryEvent(db, {
		id,
		userId,
		kind: eventParams.kind,
		payloadJson: JSON.stringify(eventParams.payload),
		capturedAt: eventParams.captured_at ?? now,
		ingestedAt: now,
		source: eventParams.source,
		sessionId: activeSessionId,
		entityKind: eventParams.entity_kind ?? null,
		entityId: eventParams.entity_id ?? null,
		geoHash: eventParams.geo_hash ?? null,
	})

	return {
		id,
		status: 'logged',
	}
}
