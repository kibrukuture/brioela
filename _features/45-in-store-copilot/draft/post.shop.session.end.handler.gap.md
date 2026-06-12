# Draft: post.shop.session.end.handler.ts (gap — file does not exist)

Target: `backend/src/api/shop/_handlers/post.shop.session.end.handler.ts`

**Gap:** No `POST /api/shop/session/end` (G20).

**Source:** `build-guide/32-in-store-copilot/01-session-lifecycle.md`

---

```typescript
import type { Context } from 'hono'
import {
  endShopSessionRequestSchema,
  endShopSessionResponseSchema,
} from '@brioela/shared/validator/shop/shop.session.schema'
import { closeShopVisit } from '@/agents/brain/_handlers/shop/close.shop.visit.handler'

export async function postShopSessionEndHandler(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = endShopSessionRequestSchema.parse(await c.req.json())

  const result = await closeShopVisit(c.env, {
    userId,
    visitId: body.visitId,
    reason: body.reason,
  })

  const response = endShopSessionResponseSchema.parse({
    visitId: body.visitId,
    workflowEnqueued: result.workflowEnqueued,
  })

  return c.json(response)
}
```
