# Gap snapshot: backend /v1/auth/* router

Target: `backend/src/api/auth/auth.routes.ts` (new) + mount in `mount.routes.handler.ts`

**Status:** Route constant exists; no handler package. Spec: `shared/api/auth.routes.ts`; `ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE` includes `/v1/auth/*`.

**Evidence:** `glob backend/src/api/auth/**` — zero files. `AUTH_ROUTES.base: "/v1/auth"` in shared only. Auth is entirely Supabase client-side today; backend validates JWT on all other routes.

```typescript
import { Hono } from 'hono'
import type { AppEnvironment } from '@/app/context.type'
import { AUTH_ROUTES } from '@brioela/shared/api/auth.routes'

export const authRoutes = new Hono<AppEnvironment>()

authRoutes.get(`${AUTH_ROUTES.base}/health`, (c) => c.json({ ok: true }))

// Future: server-mediated OAuth callbacks, magic-link exchange, admin tooling — TBD
```

**Note:** Skip list already exempts `/v1/auth/*` from JWT middleware (`no-middleware-check.routes.ts`). Any new auth endpoints must stay on skip list or use alternate verification.
