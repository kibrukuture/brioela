# Draft: search.session.history.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/search.session.history.tool.ts`

**Gap (feature 16):** AI SDK tool factory.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { searchSessionHistorySchema } from '@/agents/brain/_tools/_schemas/search.session.history.schema'
import { searchSessionHistoryPrompt } from '@/agents/brain/_tools/_prompts/search.session.history.prompt'
import { searchSessionHistoryExecutable } from '@/agents/brain/_tools/_executables/search.session.history.executable'

export const searchSessionHistoryTool = (db: BrainDatabase, userId: string) =>
	tool({
		description: searchSessionHistoryPrompt,
		inputSchema: searchSessionHistorySchema,
		execute: async (params) => searchSessionHistoryExecutable(db, userId, params),
	})
```
