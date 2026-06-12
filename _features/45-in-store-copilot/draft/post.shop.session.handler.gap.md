# Draft: post.shop.session.handler.ts (gap — file does not exist)

Target: `backend/src/api/shop/_handlers/post.shop.session.handler.ts`

**Gap:** No `POST /api/shop/session` (G18).

**Source:** `brioela-specs/45-in-store-copilot.md`

---

```typescript
import type { Context } from 'hono'
import {
  startShopSessionRequestSchema,
  startShopSessionResponseSchema,
} from '@brioela/shared/validator/shop/shop.session.schema'
import { checkInStoreCopilotEntitlement } from '@/agents/brain/_helpers/pricing/check.in.store.copilot.entitlement.helper'
import { startShopMiraSession } from '@/agents/brain/_handlers/shop/start.shop.mira.session.handler'

export async function postShopSessionHandler(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = startShopSessionRequestSchema.parse(await c.req.json())

  const entitlement = await checkInStoreCopilotEntitlement(c.env, userId)
  if (!entitlement.allowed) {
    return c.json(
      { code: 'tier_upgrade_required', feature: 'in_store_copilot', minimumTier: 'culina' },
      402,
    )
  }

  const started = await startShopMiraSession(c.env, {
    userId,
    placeId: body.placeId,
    listSource: body.listSource,
    dictatedListItems: body.dictatedListItems,
    activeMesaAudienceId: body.activeMesaAudienceId,
  })

  const response = startShopSessionResponseSchema.parse({
    visitId: started.visitId,
    miraSessionId: started.miraSessionId,
    doAudioEndpoint: started.doAudioEndpoint,
    mobileAudioToken: started.mobileAudioToken,
    context: started.context,
    expiresAt: started.expiresAt,
  })

  return c.json(response, 201)
}
```
