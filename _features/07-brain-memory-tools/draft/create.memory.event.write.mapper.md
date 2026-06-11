# Draft: create.memory.event.write.mapper.ts

Target: `backend/src/agents/brain/_mappers/create.memory.event.write.mapper.ts`

```typescript
import { createId } from '@brioela/shared/_ids'
import type { AppendBrainMemoryEvent } from '@/agents/brain/_rpc'
import type { BrainMemoryEventWrite } from '@/agents/brain/_types'

export function createMemoryEventWrite(
	memoryEventAppend: AppendBrainMemoryEvent,
	ingestedAt: number,
): BrainMemoryEventWrite {
	return {
		id: createId(),
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
```
