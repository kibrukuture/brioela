# Gap snapshot: update.location.signal.summary.helper.ts

Target: `backend/src/api/finds/_helpers/update.location.signal.summary.helper.ts`

**Status:** Not in repo. From `build-guide/09-ground/01-find-data-model.md`.

```typescript
import type { FindSignalType } from '@brioela/shared/validator/find'
import { getDb } from '@/core/db'
import { locationSignalSummary } from '@brioela/shared/drizzle/schema/location.signal.summary'
import { sql } from 'drizzle-orm'

type UpdateSummaryInput = {
  locationId: string
  signalType: FindSignalType
  capturedAt: string
  delta: 1 | -1
  env: Env
}

export async function updateLocationSignalSummary(input: UpdateSummaryInput): Promise<void> {
  const db = getDb(input.env)
  const capturedAtDate = new Date(input.capturedAt)

  await db
    .insert(locationSignalSummary)
    .values({
      locationId: input.locationId,
      signalType: input.signalType,
      activeCount: input.delta === 1 ? 1 : 0,
      lastFindAt: capturedAtDate,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [locationSignalSummary.locationId, locationSignalSummary.signalType],
      set: {
        activeCount: sql`GREATEST(0, ${locationSignalSummary.activeCount} + ${input.delta})`,
        lastFindAt: sql`
          CASE
            WHEN ${input.delta} = 1 AND (${locationSignalSummary.lastFindAt} IS NULL OR ${capturedAtDate} > ${locationSignalSummary.lastFindAt})
            THEN ${capturedAtDate}
            ELSE ${locationSignalSummary.lastFindAt}
          END
        `,
        updatedAt: new Date(),
      },
    })
}
```

**Maintenance:** `age.finds.maintenance.job.ts` decrements `active_count` when finds go stale/archived.
