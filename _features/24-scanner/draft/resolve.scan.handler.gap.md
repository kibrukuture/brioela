# Gap snapshot: resolve.scan.handler.ts

Target: `backend/src/api/scan/_handlers/resolve.scan.handler.ts`

**Status:** Not in repo. Orchestration spine from `build-guide/07-scanner/01-barcode-decode.md`.

---

```typescript
import { CreateScanInputSchema } from '@brioela/shared/validator/scan'
import { supabase } from '@/core/db/supabase.client'
import { resolveProduct } from '../_helpers/resolve.product.helper'
import { buildResolvedProductFactSnapshot } from '../_helpers/product-fact-snapshot.helper'
import { getProductCommunityHealthSummary } from '../_helpers/community-health-summary.helper'
import { checkConstraints } from '../_helpers/check.constraints.helper'
import { checkConditions } from '../_helpers/check.conditions.helper'
import { buildVerdict } from '../_helpers/build.verdict.helper'
import type { AppContext } from '@/index'

export async function resolveScan(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const input = CreateScanInputSchema.parse(body)

  const scanEventId = crypto.randomUUID()
  await supabase.from('scan_events').insert({
    id: scanEventId,
    user_id: userId,
    upc: input.upc,
    raw_scan_type: input.rawScanType,
    geo_hash: input.geoHash,
    captured_at: new Date(input.capturedAt).toISOString(),
    ingested_at: new Date().toISOString(),
    status: 'pending',
  })

  const product = await resolveProduct(input.upc, userId, c.env)

  if (!product) {
    await supabase.from('scan_events').update({ status: 'unresolved' }).eq('id', scanEventId)
    return {
      scanEventId,
      verdict: null,
      status: 'unresolved',
      message: 'Product not found in our database yet.',
    }
  }

  const productFactSnapshot = await buildResolvedProductFactSnapshot(product, c.env)
  const communityHealth = await getProductCommunityHealthSummary(product.id, c.env)
  const constraintResult = await checkConstraints(productFactSnapshot, userId, c.env)
  const conditionEvaluation = await checkConditions(productFactSnapshot, userId, scanEventId, c.env)

  const verdict = buildVerdict(
    productFactSnapshot,
    constraintResult,
    communityHealth,
    conditionEvaluation.conditionFlags,
  )

  await supabase
    .from('scan_events')
    .update({
      product_id: product.id,
      verdict: verdict.level,
      status: 'resolved',
    })
    .eq('id', scanEventId)

  const brainId = c.env.BRAIN.idFromName(userId)
  const brain = c.env.BRAIN.get(brainId)
  await brain.fetch(
    new Request('https://internal/log-scan', {
      method: 'POST',
      body: JSON.stringify({
        scanEventId,
        productId: product.id,
        productName: product.name,
        verdict: verdict.level,
        geoHash: input.geoHash,
        capturedAt: input.capturedAt,
      }),
    }),
  )

  return {
    scanEventId,
    product,
    productFactSnapshot,
    verdict,
    constraintResult,
    communityHealth,
    conditionFlags: conditionEvaluation.conditionFlags,
  }
}
```

**Integration point:** `buildVerdict` merges **07** constraints, **22** community overlay, **23** conditionFlags into one payload.
