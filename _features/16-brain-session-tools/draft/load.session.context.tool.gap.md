# Draft: load.session.context.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/load.session.context.tool.ts`

**Gap (feature 16):** AI SDK tool factory.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { loadSessionContextSchema } from '@/agents/brain/_tools/_schemas/load.session.context.schema'
import { loadSessionContextPrompt } from '@/agents/brain/_tools/_prompts/load.session.context.prompt'
import { loadSessionContextExecutable } from '@/agents/brain/_tools/_executables/load.session.context.executable'

export const loadSessionContextTool = (db: BrainDatabase, userId: string) =>
	tool({
		description: loadSessionContextPrompt,
		inputSchema: loadSessionContextSchema,
		execute: async (params) => loadSessionContextExecutable(db, userId, params),
	})
```
