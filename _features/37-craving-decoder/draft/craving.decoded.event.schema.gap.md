# Draft: craving.decoded.event.schema.ts (gap — file does not exist)

Target: `shared/validator/craving-decoder/craving.decoded.event.schema.ts`

**Gap:** No Zod schema or kind constant for `craving_decoded` events.

**Source:** `brioela-specs/52-craving-decoder.md`, `implementable-specs/01-memory-event.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const CRAVING_DECODED_EVENT_KIND = 'craving_decoded' as const

export const CravingCategorySchema = z.enum([
  'sweet',
  'salty',
  'savory',
  'comfort',
  'carb',
  'caffeine',
  'other',
])

export const CravingCauseSchema = z.enum([
  'short_sleep',
  'eating_gap',
  'stress',
  'glucose_drop',
  'time_of_day_pattern',
  'cycle_pattern',
  'travel',
  'no_pattern',
])

export const CravingEvidenceRefSchema = z.object({
  source: z.string(),
  refKind: z.enum(['memory_event', 'user_memory', 'behavior_pattern', 'wellbeing_signal']),
  refId: z.string().optional(),
  summary: z.string(),
})

export const CravingUserActionNextSchema = z.enum([
  'bridge_accepted',
  'cooked',
  'scanned_and_bought',
  'ignored',
  'declined_offer',
  'unknown',
])

export const CravingDecodedPayloadSchema = z.object({
  category: CravingCategorySchema,
  productId: z.string().optional(),
  productName: z.string().optional(),
  namedCauses: z.array(CravingCauseSchema).max(2),
  evidenceRefs: z.array(CravingEvidenceRefSchema),
  offerType: z.enum(['pantry_bridge', 'tonight_adjust', 'flatter_alternative', 'none']).optional(),
  offerSummary: z.string().optional(),
  userActionNext: CravingUserActionNextSchema.default('unknown'),
  sessionSurface: z.enum(['chat', 'scan', 'scan_followup', 'cooking']),
  disorderedEatingGuardTriggered: z.boolean().default(false),
})

export type CravingDecodedPayload = z.infer<typeof CravingDecodedPayloadSchema>
```

**Note:** `kind` remains free text in SQLite per **05** — constant is code-only, not SQL constraint.
