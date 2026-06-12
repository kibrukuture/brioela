# Gap snapshot: get.menu.scan.handler.ts

Target: `backend/src/api/menu-scans/_handlers/get.menu.scan.handler.ts`

**Status:** Not in repo. Optional — for async **25** handoff or saved scan replay.

```typescript
import type { AppContext } from '@/index'
import { MenuScanResultSchema } from '@brioela/shared/validator/menu.scan'

export async function getMenuScan(c: AppContext) {
  const userId = c.get('userId')
  const scanId = c.req.param('scanId')

  // v1: in-memory KV or short-lived session store; saved scans in Supabase optional
  const cached = await c.env.MENU_SCAN_SESSIONS.get(`${userId}:${scanId}`)
  if (!cached) {
    return c.json({ error: 'scan_not_found' }, 404)
  }

  const parsed = MenuScanResultSchema.safeParse(JSON.parse(cached))
  if (!parsed.success) {
    return c.json({ error: 'scan_corrupt' }, 500)
  }

  return c.json(parsed.data)
}
```

**Transient rule:** Default session TTL aggressive; raw extracted text never in cache payload.
