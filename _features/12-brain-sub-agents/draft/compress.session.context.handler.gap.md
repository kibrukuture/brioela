# Draft: compress.session.context.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/session-context-compressor/compress.session.context.handler.ts`

**Gap (feature 12):** Haiku compression call not shipped. Schema from **17** — not obsolete ledger **0003** fields.

**13 owns:** calling this via `subAgent()` and applying DB updates.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import {
	compressionSummarySchema,
	type CompressionSummary,
} from '@/agents/brain/_schemas/compression.summary.schema'
import { SESSION_CONTEXT_COMPRESSOR_SYSTEM_PROMPT } from '@/agents/brain/_subagents/session-context-compressor/session.context.compressor.system.prompt'

type SessionTurn = {
	role: 'user' | 'assistant' | 'system' | 'tool'
	content: string
	turnNumber: number
}

type CompressSessionContextInput = {
	turns: SessionTurn[]
	sessionType: 'chat' | 'cooking'
	anthropicApiKey: string
}

export async function compressSessionContext(input: CompressSessionContextInput): Promise<CompressionSummary> {
	const transcript = input.turns
		.sort((a, b) => a.turnNumber - b.turnNumber)
		.map((t) => `[${t.role.toUpperCase()}] ${t.content}`)
		.join('\n\n')

	const anthropic = createAnthropic({ apiKey: input.anthropicApiKey })

	const { object } = await generateObject({
		model: anthropic('claude-haiku-4-5-20251001'),
		schema: compressionSummarySchema,
		system: SESSION_CONTEXT_COMPRESSOR_SYSTEM_PROMPT,
		prompt: `Session type: ${input.sessionType}\n\n${transcript}`,
	})

	return object
}
```

**No DB access.** Caller (**13**) marks old session `compressed`, inserts continuation session, carries last 10 turns.
