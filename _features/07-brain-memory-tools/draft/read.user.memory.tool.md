# Draft: read.user.memory.tool.ts

Target: `backend/src/agents/brain/_tools/read.user.memory.tool.ts`

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { readUserMemorySchema } from '@/agents/brain/_tools/_schemas/read.user.memory.schema'
import { readUserMemoryPrompt } from '@/agents/brain/_tools/_prompts/read.user.memory.prompt'
import { readUserMemoryExecutable } from '@/agents/brain/_tools/_executables/read.user.memory.executable'

export const readUserMemoryTool = (
	db: BrainDatabase,
	userId: string,
	waitUntil?: (promise: Promise<void>) => void,
) => tool({
	description: readUserMemoryPrompt,
	inputSchema: readUserMemorySchema,
	execute: async (params) => readUserMemoryExecutable(db, userId, params, waitUntil),
})
```
