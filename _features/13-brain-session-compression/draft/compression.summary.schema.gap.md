# Draft: compression.summary.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/compression.summary.schema.ts`

**Gap (feature 13):** Zod schema for Haiku compressor output. **12** SessionContextCompressor imports this file.

**Obsolete:** Ledger `07-sub-agents/0003` used `topics`, `open_items`, `behavior_signals` arrays — **reject**.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

export const compressionSummarySchema = z.object({
	intent: z.string().min(1).max(500),
	accomplished: z.string().min(1).max(1000),
	decisions: z.string().max(500).default(''),
	continuing: z.string().max(500).default(''),
})

export type CompressionSummary = z.infer<typeof compressionSummarySchema>
```

Stored in `sessions.outcome_summary` as `JSON.stringify(summary)` when `status = 'compressed'`.

Source: `implementable-specs/17-session-lifecycle.md` lines 139–149.

Export from `_schemas/index.ts` when added.
