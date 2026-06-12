# Gap snapshot: log.menu.scanned.helper.ts

Target: `backend/src/api/menu-scans/_helpers/log.menu.scanned.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/05-storage-offline-map.md`, `implementable-specs/01-memory-event.md`.

```typescript
import type { MenuScanResult } from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'
import { createHash } from 'node:crypto'

export async function logMenuScanned(
  env: Env,
  userId: string,
  result: MenuScanResult,
): Promise<void> {
  const brainId = env.BRAIN.idFromName(userId)
  const brain = env.BRAIN.get(brainId)

  const resolvedUrlHash = result.resolvedUrl
    ? createHash('sha256').update(result.resolvedUrl).digest('hex').slice(0, 16)
    : null

  await brain.fetch(
    new Request('https://internal/log-memory-event', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'menu_scanned',
        payload: {
          restaurantId: result.restaurantId,
          placeName: result.placeName,
          source: result.source,
          resolvedUrlHash,
          dishCount: result.dishes.length,
          redCount: result.redCount,
          yellowCount: result.yellowCount,
          greenCount: result.greenCount,
          saved: false,
        },
      }),
    }),
  )
}
```

**Privacy:** No raw menu text, dish descriptions, or waiter questions in payload.
