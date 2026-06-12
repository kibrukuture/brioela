# Draft: post.pantry.snapshot.handler.ts (gap — file does not exist)

Target: `backend/src/api/pantry/_handlers/post.pantry.snapshot.handler.ts`

**Gap (feature 34):** `POST /api/pantry/snapshots` — image upload, vision detect, persist snapshot.

---

```typescript
import type { Context } from 'hono'
import { PostPantrySnapshotRequestSchema } from '@shared/validator/pantry/pantry.snapshot.schema'
import { detectPantryItemsFromImage } from '@/agents/brain/_handlers/pantry/vision.detect.pantry.items.handler'
import { writePantrySnapshot } from '@/agents/brain/_handlers/pantry/write.pantry.snapshot.handler'
import { matchPantryRecipes } from '@/agents/brain/_handlers/pantry/match.pantry.recipes.helper'
import { checkPantryRescueEntitlement } from '@/agents/brain/_helpers/check.pantry.rescue.entitlement.helper'

export async function postPantrySnapshotHandler(c: Context) {
  const userId = c.get('userId') as string
  await checkPantryRescueEntitlement(userId)

  const body = PostPantrySnapshotRequestSchema.parse(await c.req.json())
  const detection = await detectPantryItemsFromImage({
    imageBase64: body.imageBase64,
    mimeType: 'image/jpeg',
  })

  const snapshotId = await writePantrySnapshot({
    userId,
    sourceType: body.sourceType,
    detections: detection.items,
  })

  const matches = await matchPantryRecipes({
    userId,
    snapshotId,
    detectedLabels: detection.items.map((i) => i.itemLabel),
  })

  return c.json({
    snapshotId,
    detections: detection.items,
    matches,
  })
}
```

Blocked: G1 (API module), G5 (vision), **43** Culina entitlement.
