# Gap snapshot: create.menu.scan.url.handler.ts

Target: `backend/src/api/menu-scans/_handlers/create.menu.scan.url.handler.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/01-input-capture.md` (URL + QR paths).

```typescript
import type { AppContext } from '@/index'
import {
  MenuScanUrlRequestSchema,
  MenuScanResultSchema,
} from '@brioela/shared/validator/menu.scan'
import { checkMenuEntitlement } from '../_helpers/check.menu.entitlement.helper'
import { fetchMenuUrlText } from '../_helpers/fetch.menu.url.helper'
import { parseMenuFromText } from '../_helpers/parse.menu.helper'
import { evaluateDishVerdicts } from '../_helpers/evaluate.dish.verdicts.helper'
import { getPlaceMenuOverlay } from '../_helpers/get.place.menu.overlay.helper'
import { contributeSharedMenuIntelligence } from '../_helpers/contribute.shared.menu.intelligence.helper'
import { logMenuScanned } from '../_helpers/log.menu.scanned.helper'

function resolveSource(input: { url: string; qrPayload?: string }) {
  return input.qrPayload ? ('qr_url' as const) : ('url' as const)
}

export async function createMenuScanUrl(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = MenuScanUrlRequestSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400)
  }

  if (!parsed.data.url.startsWith('https://') && !parsed.data.url.startsWith('http://')) {
    return c.json({ error: 'invalid_url_scheme' }, 400)
  }

  await checkMenuEntitlement(userId, c.env)

  const scanId = crypto.randomUUID()
  const source = resolveSource(parsed.data)

  const fetched = await fetchMenuUrlText(parsed.data.url, c.env)
  if (!fetched.ok) {
    return c.json(
      {
        scanId,
        status: fetched.status,
        message: fetched.message,
      },
      422,
    )
  }

  const menu = await parseMenuFromText({
    source,
    combinedText: fetched.text,
    restaurantId: parsed.data.restaurantId ?? null,
    placeName: parsed.data.placeName ?? null,
    resolvedUrl: fetched.resolvedUrl,
    env: c.env,
  })

  if (menu.dishes.length === 0) {
    return c.json(
      {
        scanId,
        status: 'menu_not_found',
        message: 'Could not find menu content on this page. Try photographing the menu instead.',
        parserWarnings: menu.parserWarnings,
      },
      422,
    )
  }

  const evaluation = await evaluateDishVerdicts(userId, menu.dishes, c.env)
  const placeOverlay = parsed.data.restaurantId
    ? await getPlaceMenuOverlay(parsed.data.restaurantId, c.env)
    : null

  const result = MenuScanResultSchema.parse({
    scanId,
    source,
    restaurantId: parsed.data.restaurantId ?? null,
    placeName: parsed.data.placeName ?? null,
    resolvedUrl: fetched.resolvedUrl,
    visionWarnings: [],
    parserWarnings: menu.parserWarnings,
    dishes: evaluation.dishes,
    placeOverlay,
    greenCount: evaluation.greenCount,
    yellowCount: evaluation.yellowCount,
    redCount: evaluation.redCount,
    guardrailsUnavailable: evaluation.guardrailsUnavailable,
    createdAt: Date.now(),
  })

  c.executionCtx.waitUntil(
    Promise.all([
      contributeSharedMenuIntelligence(c.env, {
        placeId: parsed.data.restaurantId,
        parsedMenu: menu,
        source,
        resolvedUrl: fetched.resolvedUrl,
      }),
      logMenuScanned(c.env, userId, result),
    ]),
  )

  return c.json(result)
}
```

**QR rule:** Client validates QR payload is URL before POST; backend stores `qrPayload` separately from final `resolvedUrl`.
