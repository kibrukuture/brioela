# Draft: post.shop.session.events.handler.ts (gap — file does not exist)

Target: `backend/src/api/shop/_handlers/post.shop.session.events.handler.ts`

**Gap:** No `POST /api/shop/session/events` (G19).

**Source:** `brioela-specs/45-in-store-copilot.md`

---

```typescript
import type { Context } from 'hono'
import { shopSessionEventRequestSchema } from '@brioela/shared/validator/shop/shop.session.schema'
import { getBrainStub } from '@/agents/brain/get.brain.stub'
import { appendShopVisitEvent } from '@/agents/brain/_handlers/shop/append.shop.visit.event.helper'

export async function postShopSessionEventsHandler(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = shopSessionEventRequestSchema.parse(await c.req.json())

  const brain = getBrainStub(c.env, userId)
  const visit = await brain.getShopVisit(body.visitId)
  if (!visit || visit.userId !== userId) {
    return c.json({ code: 'visit_not_found' }, 404)
  }

  await appendShopVisitEvent(brain.db, {
    visitId: body.visitId,
    eventType: mapClientEvent(body.eventType),
    payload: body.payload ?? {},
  })

  if (body.eventType === 'checkout_started') {
    await brain.closeShopVisit(body.visitId, 'checkout')
  }

  return c.json({ ok: true })
}

function mapClientEvent(
  eventType: 'list_item_checked' | 'dictated_item_added' | 'user_done' | 'checkout_started',
): 'scan' | 'swap_suggested' | 'swap_taken' | 'constraint_warning' | 'ground_find_relayed' | 'total_milestone' {
  if (eventType === 'checkout_started') return 'total_milestone'
  return 'scan'
}
```
