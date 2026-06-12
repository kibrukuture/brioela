# Gap snapshot: evaluate.alerts.handler.ts

Target: `backend/src/api/map/_handlers/evaluate.alerts.handler.ts`

**Status:** Not in repo. From `build-guide/10-map/05-price-alerts.md`, spec 15.

```typescript
import type { AppContext } from '@/index'
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import { generateAlertCandidates } from '../_helpers/generate.alert.candidates.helper'

type EvaluateAlertsBody = {
  userId?: string
  productId?: string
  placeId?: string
  scope?: 'user' | 'nearby_batch'
}

export async function evaluateAlerts(c: AppContext) {
  const internalKey = c.req.header('x-internal-worker-key')
  if (internalKey !== c.env.INTERNAL_WORKER_KEY) {
    throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'internal_only' })
  }

  const body = (await c.req.json()) as EvaluateAlertsBody

  const result = await generateAlertCandidates({
    userId: body.userId,
    productId: body.productId,
    placeId: body.placeId,
    scope: body.scope ?? 'user',
    env: c.env,
  })

  return c.json({
    candidatesCreated: result.created,
    suppressed: result.suppressed,
    deliveredQueued: result.queuedForPush,
  })
}
```

**Delivery boundary:** this handler creates `alert_candidate` rows only — **21** sends `price_alert` / `map_nearby_opportunity` push.
