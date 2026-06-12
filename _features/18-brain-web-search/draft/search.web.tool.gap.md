# Draft: search.web.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/search.web.tool.ts`

**Gap (feature 18):** Thin AI SDK wrapper per ledger 0007 + alarm tool pattern.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { searchWebSchema } from '@/agents/brain/_tools/_schemas/search.web.schema'
import { searchWebPrompt } from '@/agents/brain/_tools/_prompts/search.web.prompt'
import {
	type SessionWebSearchCounter,
	searchWebExecutable,
} from '@/agents/brain/_tools/_executables/search.web.executable'

type SearchWebEnv = Pick<Env, 'TAVILY_API_KEY' | 'EXA_API_KEY'>

export const searchWebTool = (
	database: BrainDatabase,
	userId: string,
	activeSessionId: string | null,
	env: SearchWebEnv,
	sessionWebSearchCounter: SessionWebSearchCounter,
	waitUntil?: (promise: Promise<void>) => void,
) => tool({
	description: searchWebPrompt,
	inputSchema: searchWebSchema,
	execute: async (params) =>
		searchWebExecutable(
			database,
			userId,
			activeSessionId,
			env,
			sessionWebSearchCounter,
			params,
			waitUntil,
		),
})
```
