# Gap snapshot: post.sighting.handler.ts

Target: `backend/src/api/map/_handlers/post.sighting.handler.ts`

**Status:** Not in repo. From `build-guide/10-map/04-product-sightings.md`, `07-scanner/04-scan-result-ui.md`.

```typescript
import type { AppContext } from '@/index'
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import {
  CreateSightingRequestSchema,
  ProductSightingSchema,
} from '@brioela/shared/validator/map.schema'
import { getDb } from '@/core/db'
import { productSighting } from '@brioela/shared/drizzle/schema/product.sighting.schema'
import { and, eq } from 'drizzle-orm'

export async function postSighting(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = CreateSightingRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw new HTTPException(ErrorCode.INVALID_INPUT, {
      message: parsed.error.issues[0]?.message ?? 'invalid_body',
    })
  }

  const { placeId, productId, confidence, seenAt } = parsed.data
  const db = getDb(c.env)
  const seenAtDate = seenAt ? new Date(seenAt) : new Date()

  const [existing] = await db
    .select()
    .from(productSighting)
    .where(
      and(
        eq(productSighting.placeId, placeId),
        eq(productSighting.productId, productId),
      ),
    )
    .limit(1)

  if (existing) {
    const bumpedConfidence = Math.min(1, Math.max(existing.confidence, confidence) + 0.15)
    const [updated] = await db
      .update(productSighting)
      .set({
        seenAt: seenAtDate,
        reporterUserId: userId,
        confidence: bumpedConfidence,
        updatedAt: new Date(),
      })
      .where(eq(productSighting.sightingId, existing.sightingId))
      .returning()

    return c.json({
      sighting: ProductSightingSchema.parse({
        sightingId: updated.sightingId,
        placeId: updated.placeId,
        productId: updated.productId,
        seenAt: updated.seenAt.toISOString(),
        confidence: updated.confidence,
        firstSeenAt: updated.firstSeenAt?.toISOString() ?? null,
      }),
      reconfirmed: true,
    })
  }

  const [inserted] = await db
    .insert(productSighting)
    .values({
      placeId,
      productId,
      seenAt: seenAtDate,
      reporterUserId: userId,
      confidence,
      firstSeenAt: seenAtDate,
    })
    .returning()

  return c.json({
    sighting: ProductSightingSchema.parse({
      sightingId: inserted.sightingId,
      placeId: inserted.placeId,
      productId: inserted.productId,
      seenAt: inserted.seenAt.toISOString(),
      confidence: inserted.confidence,
      firstSeenAt: inserted.firstSeenAt?.toISOString() ?? null,
    }),
    reconfirmed: false,
  })
}
```

**Inputs:** product scan with place match (**24**), receipt, Bela shopper (**42**), normalized Ground availability mention (**27**).
