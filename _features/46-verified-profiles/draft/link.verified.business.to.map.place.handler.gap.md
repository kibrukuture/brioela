# Draft: link.verified.business.to.map.place.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/verified/link.verified.business.to.map.place.handler.ts`

Source: `build-guide/23-verified-profiles/03-verified-business.md`, `_features/28-map/draft/map.place.schema.gap.md`

**28** owns `map_place` schema; **46** writes `verification_status` on business verify.

---

```typescript
import { eq } from 'drizzle-orm'
import { mapPlace } from '@/shared/drizzle/schema/map.place.schema'
import { db } from '@/core/database'

export async function linkVerifiedBusinessToMapPlace(input: {
  placeId: string
  verificationStatus: 'verified' | 'unverified' | 'pending'
}): Promise<void> {
  await db
    .update(mapPlace)
    .set({ verificationStatus: input.verificationStatus, updatedAt: new Date() })
    .where(eq(mapPlace.placeId, input.placeId))
}
```

Call from admin `decide.verification.application.handler` when business application approved with `place_id`.
