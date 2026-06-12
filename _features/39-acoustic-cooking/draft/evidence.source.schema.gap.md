# Draft: evidence.source.schema.ts (gap — file does not exist)

Target: `shared/validator/acoustic-cooking/evidence.source.schema.ts`

**Gap:** No shared Zod enum for `evidence_source`.

**Source:** `build-guide/33-acoustic-cooking/03-intervention-events.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const evidenceSourceSchema = z.enum(['visual', 'acoustic', 'fused'])

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>

export const writeInterventionEventInputSchema = z.object({
  sessionId: z.string().uuid(),
  eventType: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidenceSource: evidenceSourceSchema,
  recipeStepOrder: z.number().int().positive().nullable().optional(),
})

export type WriteInterventionEventInput = z.infer<typeof writeInterventionEventInputSchema>
```
