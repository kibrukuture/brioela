# Draft: compression.summary.schema.ts (gap — cross-ref feature 13)

Target: `backend/src/agents/brain/_schemas/compression.summary.schema.ts`

**Gap:** File does not exist. **13** owns build; **12** SessionContextCompressor consumes.

**Obsolete:** Ledger `07-sub-agents/0003` used `topics/decisions/open_items/behavior_signals` — **reject**.

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

Source: `implementable-specs/17-session-lifecycle.md` lines 139–149.

Stored in `sessions.outcome_summary` as JSON when `status = 'compressed'`.

Build ownership: **13-brain-session-compression** — duplicated here for **12** draft review.
