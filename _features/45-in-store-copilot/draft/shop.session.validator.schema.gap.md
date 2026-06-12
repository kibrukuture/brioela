# Draft: shop.session.schema.ts (gap — file does not exist)

Target: `shared/validator/shop/shop.session.schema.ts`

**Gap:** No shared Zod contract for shop session API.

**Source:** `brioela-specs/45-in-store-copilot.md`, `build-guide/32-in-store-copilot/01-session-lifecycle.md`

---

```typescript
import { z } from 'zod'
import { shopContextPayloadSchema } from './shop.context.payload.schema'

export const startShopSessionRequestSchema = z.object({
  placeId: z.string().min(1),
  listSource: z.enum(['plan', 'pantry', 'dictated', 'mixed']).optional(),
  activeMesaAudienceId: z.string().uuid().optional(),
  dictatedListItems: z.array(z.string().min(1)).max(80).optional(),
})

export const startShopSessionResponseSchema = z.object({
  visitId: z.string().uuid(),
  miraSessionId: z.string().uuid(),
  doAudioEndpoint: z.string().url(),
  mobileAudioToken: z.string(),
  context: shopContextPayloadSchema,
  expiresAt: z.string().datetime(),
})

export const shopSessionEventRequestSchema = z.object({
  visitId: z.string().uuid(),
  eventType: z.enum([
    'list_item_checked',
    'dictated_item_added',
    'user_done',
    'checkout_started',
  ]),
  payload: z.record(z.unknown()).optional(),
})

export const endShopSessionRequestSchema = z.object({
  visitId: z.string().uuid(),
  reason: z.enum(['user_done', 'checkout', 'geofence_exit', 'timeout', 'error']),
})

export const endShopSessionResponseSchema = z.object({
  visitId: z.string().uuid(),
  workflowEnqueued: z.boolean(),
})

export type StartShopSessionRequest = z.infer<typeof startShopSessionRequestSchema>
export type StartShopSessionResponse = z.infer<typeof startShopSessionResponseSchema>
export type ShopSessionEventRequest = z.infer<typeof shopSessionEventRequestSchema>
export type EndShopSessionRequest = z.infer<typeof endShopSessionRequestSchema>
```
