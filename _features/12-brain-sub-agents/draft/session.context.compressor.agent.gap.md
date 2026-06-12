# Draft: session.context.compressor.agent.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/session-context-compressor/session.context.compressor.agent.ts`

**Gap (feature 12):** DO class not in production. Obsolete ledger `0003` used inline handler — **prefer spec 17** ephemeral DO pattern.

**13 owns:** threshold check + `applyCompression` DB writes. **12 owns:** this DO + Haiku reasoning.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { Agent, callable } from 'agents'
import { compressSessionContext } from '@/agents/brain/_subagents/session-context-compressor/compress.session.context.handler'
import type { CompressionSummary } from '@/agents/brain/_schemas/compression.summary.schema'
import { z } from '@brioela/shared/zod'

const sessionTurnSchema = z.object({
	role: z.enum(['user', 'assistant', 'system', 'tool']),
	content: z.string(),
	turnNumber: z.number().int().nonnegative(),
})

const compressContextInputSchema = z.object({
	sessionId: z.string().min(1),
	sessionType: z.enum(['chat', 'cooking']),
	turns: z.array(sessionTurnSchema).min(1),
})

export type CompressContextInput = z.infer<typeof compressContextInputSchema>

export class SessionContextCompressor extends Agent<Cloudflare.Env> {
	@callable()
	async compressContext(input: CompressContextInput): Promise<CompressionSummary> {
		const parsed = compressContextInputSchema.parse(input)
		return compressSessionContext({
			turns: parsed.turns,
			sessionType: parsed.sessionType,
			anthropicApiKey: this.env.ANTHROPIC_API_KEY,
		})
	}
}
```

**No tools.** No Brain SQLite access. Pure reasoning sub-agent per **17**.
