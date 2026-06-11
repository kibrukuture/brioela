# Draft: log.memory.event.tool.ts

Target: `backend/src/agents/brain/_tools/log.memory.event.tool.ts`

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { logMemoryEventSchema } from '@/agents/brain/_tools/_schemas/log.memory.event.schema'
import { logMemoryEventPrompt } from '@/agents/brain/_tools/_prompts/log.memory.event.prompt'
import { logMemoryEventExecutable } from '@/agents/brain/_tools/_executables/log.memory.event.executable'

export const logMemoryEventTool = (
	db: BrainDatabase,
	userId: string,
	activeSessionId: string | null = null,
) => tool({
	description: logMemoryEventPrompt,
	inputSchema: logMemoryEventSchema,
	execute: async (params) => logMemoryEventExecutable(db, userId, activeSessionId, params),
})
```
