# Draft: backend/src/agents/brain/_tools/write.user.memory.tool.ts

Target: `backend/src/agents/brain/_tools/write.user.memory.tool.ts`

```
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeUserMemorySchema } from '@/agents/brain/_tools/_schemas/write.user.memory.schema'
import { writeUserMemoryPrompt } from '@/agents/brain/_tools/_prompts/write.user.memory.prompt'
import { writeUserMemoryExecutable } from '@/agents/brain/_tools/_executables/write.user.memory.executable'

export const writeUserMemoryTool = (db: BrainDatabase, userId: string) => tool({
	description: writeUserMemoryPrompt,
	inputSchema: writeUserMemorySchema,
	execute: async (params) => writeUserMemoryExecutable(db, userId, params),
})
```
