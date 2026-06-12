# Draft: shop.context.payload.schema.ts (gap — file does not exist)

Target: `shared/validator/shop/shop.context.payload.schema.ts`

**Gap:** No typed session-start payload contract.

**Source:** `build-guide/32-in-store-copilot/02-context-payload.md`

---

```typescript
import { z } from 'zod'

const shoppingListItemSchema = z.object({
  itemKey: z.string(),
  label: z.string(),
  department: z.string().optional(),
  source: z.enum(['plan', 'prediction', 'dictated']),
  status: z.enum(['pending', 'checked', 'skipped']),
})

const groundFindRelaySchema = z.object({
  findId: z.string().uuid(),
  summary: z.string(),
  locationHint: z.string().optional(),
  freshnessHours: z.number().nonnegative(),
})

export const shopContextPayloadSchema = z.object({
  visitId: z.string().uuid(),
  placeId: z.string(),
  placeLabel: z.string(),
  shoppingList: z.array(shoppingListItemSchema),
  weeklySpendBaseline: z.number().nonnegative().nullable(),
  topRecurringPrices: z.array(
    z.object({
      productId: z.string(),
      label: z.string(),
      lastPaidAmount: z.number(),
      currency: z.string().length(3),
    }),
  ),
  glucoseSpikeTriggers: z.array(
    z.object({
      productId: z.string().optional(),
      ingredientKey: z.string(),
      note: z.string(),
    }),
  ),
  groundFinds: z.array(groundFindRelaySchema),
  openPantryNudges: z.array(
    z.object({
      nudgeId: z.string().uuid(),
      itemKey: z.string(),
      label: z.string(),
    }),
  ),
  mesaAudience: z
    .object({
      audienceId: z.string().uuid(),
      label: z.string(),
      memberCount: z.number().int().positive(),
    })
    .nullable(),
  constraintSummary: z.object({
    hardAllergies: z.array(z.string()),
    dietaryIdentity: z.array(z.string()),
    activeConditions: z.array(z.string()),
  }),
})

export type ShopContextPayload = z.infer<typeof shopContextPayloadSchema>
```
