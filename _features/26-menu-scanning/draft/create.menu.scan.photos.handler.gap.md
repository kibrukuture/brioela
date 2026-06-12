# Gap snapshot: create.menu.scan.photos.handler.ts

Target: `backend/src/api/menu-scans/_handlers/create.menu.scan.photos.handler.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/01-input-capture.md`, `02`, `03`.

```typescript
import type { AppContext } from '@/index'
import {
  MenuScanPhotosRequestSchema,
  MenuScanResultSchema,
} from '@brioela/shared/validator/menu.scan'
import { checkMenuEntitlement } from '../_helpers/check.menu.entitlement.helper'
import { extractMenuVisionPages } from '../_helpers/extract.menu.vision.helper'
import { parseMenuFromText } from '../_helpers/parse.menu.helper'
import { evaluateDishVerdicts } from '../_helpers/evaluate.dish.verdicts.helper'
import { getPlaceMenuOverlay } from '../_helpers/get.place.menu.overlay.helper'
import { contributeSharedMenuIntelligence } from '../_helpers/contribute.shared.menu.intelligence.helper'
import { logMenuScanned } from '../_helpers/log.menu.scanned.helper'

export async function createMenuScanPhotos(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = MenuScanPhotosRequestSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400)
  }

  await checkMenuEntitlement(userId, c.env)

  const scanId = crypto.randomUUID()
  const source =
    parsed.data.imagesBase64.length > 1 ? ('multi_page_photo' as const) : ('photo' as const)

  const vision = await extractMenuVisionPages(parsed.data.imagesBase64, c.env)
  if (vision.minConfidence < 0.4) {
    return c.json(
      {
        scanId,
        status: 'vision_extraction_failed',
        message: 'Could not read this menu clearly. Try a closer or brighter photo.',
        visionWarnings: vision.pages.flatMap((p) => p.warnings),
      },
      422,
    )
  }

  const menu = await parseMenuFromText({
    source,
    combinedText: vision.combinedText,
    restaurantId: parsed.data.restaurantId ?? null,
    placeName: parsed.data.placeName ?? null,
    resolvedUrl: null,
    env: c.env,
  })

  if (menu.dishes.length === 0) {
    return c.json(
      {
        scanId,
        status: 'not_menu',
        message: 'This does not look like a restaurant menu.',
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
    resolvedUrl: null,
    visionWarnings: vision.pages.flatMap((p) => p.warnings),
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
        resolvedUrl: null,
      }),
      logMenuScanned(c.env, userId, result),
    ]),
  )

  return c.json(result)
}
```

**Latency:** Parallel vision per page; single parser call; dish evaluation batchable in DO.
