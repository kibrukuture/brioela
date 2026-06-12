# Draft: ambient validator schemas (gap — files do not exist)

Target: `shared/validator/ambient/*.schema.ts`

**Gap (feature 35):** Shared Zod for API + Brain RPC boundaries.

**Source:** `build-guide/18-ambient-intelligence/`, `brioela-specs/22`, `37`, `38`

---

```typescript
// shared/validator/ambient/travel.intent.schema.ts
import { z } from 'zod'

export const travelIntentDetectedEventSchema = z.object({
  type: z.literal('travel.intent_detected'),
  destinationCity: z.string().min(1),
  destinationCountry: z.string().nullable(),
  departureDate: z.number().int().nullable(),
  returnDate: z.number().int().nullable(),
  source: z.enum(['voice', 'calendar', 'map_search', 'manual']),
  confidence: z.number().min(0).max(1),
})

export const guestConstraintSchema = z.object({
  type: z.enum(['allergen', 'intolerance', 'dietary_identity', 'preference']),
  value: z.string().min(1),
  severity: z.enum(['hard', 'soft']),
})

export const activateGuestModeSchema = z.object({
  constraints: z.array(guestConstraintSchema).min(1),
  occasion: z.string().nullable().optional(),
})

export const timeMachineInlineSchema = z.object({
  text: z.string().min(1),
  momentType: z.enum([
    'first_time',
    'staple_count',
    'long_gap',
    'on_this_day',
    'milestone',
    'generational_recipe',
  ]),
})
```
