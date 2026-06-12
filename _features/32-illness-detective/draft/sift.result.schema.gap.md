# Draft: sift.result.schema.ts (gap — file does not exist)

Target: `shared/validator/sift/sift.result.schema.ts`

**Gap (feature 32):** Zod boundary for structured LLM ranking output. Enforces top-3 cap and non-diagnostic reason codes.

---

```typescript
import { z } from 'zod'

export const siftReasonCodeSchema = z.enum([
	'active_recall',
	'community_reports',
	'high_risk_category',
	'new_product',
	'outside_food',
	'followup_adjustment',
	'wearable_supporting',
])

export const siftSuspectSchema = z.object({
	suspectType: z.enum(['product', 'restaurant', 'meal']),
	suspectId: z.string().min(1),
	confidenceScore: z.number().min(0).max(1),
	reasonCode: siftReasonCodeSchema,
	reasonText: z.string().min(1).max(280),
	recallActive: z.boolean().default(false),
	actionSuggestion: z.string().min(1).max(280).optional(),
})

export const siftResultSchema = z.object({
	suspects: z.array(siftSuspectSchema).min(1).max(3),
	safetySummary: z.string().min(1).max(500),
})

export type SiftResult = z.infer<typeof siftResultSchema>
export type SiftSuspect = z.infer<typeof siftSuspectSchema>
```

Post-LLM validation failure → static fallback suspects from rule-based ordering (recall > community > heuristics).
