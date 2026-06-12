# Draft: compression.summary.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/compression.summary.schema.ts`

**Gap (feature 13 — cross-ref for 11):** Zod schema for compression output. **11** references compression chain; **13** implements compressor.

**Obsolete:** Ledger `07-sub-agents/0003` used different fields (`topics`, `open_items`, …). **Prefer `17-session-lifecycle.md`.**

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

Build owned by **13-brain-session-compression**.
