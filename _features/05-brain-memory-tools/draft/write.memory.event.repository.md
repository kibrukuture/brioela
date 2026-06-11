# Draft: write.memory.event.repository.ts

Target: `backend/src/agents/brain/_repositories/write.memory.event.repository.ts`

```typescript
import { memoryEvent, type BrainMemoryEvent } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMemoryEventWrite } from '@/agents/brain/_types'
import { getReturned } from '@/database/drizzle/_database'

export function writeMemoryEvent(
	database: BrainDatabase,
	memoryEventWrite: BrainMemoryEventWrite,
): BrainMemoryEvent {
	return getReturned(
		database
			.insert(memoryEvent)
			.values(memoryEventWrite)
			.returning(),
	)
}
```
