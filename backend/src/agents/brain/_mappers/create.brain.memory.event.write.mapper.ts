import { nanoid } from 'nanoid'
import type { AppendBrainMemoryEvent } from '@/agents/brain/_rpc'
import type { BrainMemoryEventWrite } from '@/agents/brain/_types'

export function createBrainMemoryEventWrite(
	memoryEventAppend: AppendBrainMemoryEvent,
	ingestedAt: number,
): BrainMemoryEventWrite {
	return {
		id: nanoid(24),
		userId: memoryEventAppend.userId,
		kind: memoryEventAppend.kind,
		payloadJson: JSON.stringify(memoryEventAppend.payload),
		capturedAt: memoryEventAppend.capturedAt,
		ingestedAt,
		source: memoryEventAppend.source,
		sessionId: memoryEventAppend.sessionId,
		entityKind: memoryEventAppend.entityKind,
		entityId: memoryEventAppend.entityId,
		geoHash: memoryEventAppend.geoHash,
	}
}
