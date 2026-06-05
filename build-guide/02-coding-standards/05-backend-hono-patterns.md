# Backend — Hono Patterns

## App Root

`backend/src/index.ts` is the Hono app root and the Cloudflare Worker entry point. It does two things only: mounts routes and exports DO classes. No logic.

```ts
// backend/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorMiddleware } from './middleware/error'
import { authMiddleware } from './middleware/auth'
import { mountRoutes } from './routes/index'

// DO exports — CF requires all DO classes exported from the worker entry point
export { BrioelOrchestrator } from './agents/orchestrator/index'
export { CookingAgent } from './agents/cooking/index'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())
app.use('*', errorMiddleware)
app.use('/api/*', authMiddleware)

mountRoutes(app)

export default app
```

---

## Route Files

Each feature has its own folder under `routes/`. The folder contains a `.route.ts` file (the Hono instance) and underscore-scoped subfolders for handlers and helpers. The route file imports handlers from `_handlers/index.ts` — it never contains handler logic itself.

```ts
// backend/src/routes/scan/scan.route.ts
import { Hono } from 'hono'
import { createScan, getScan, listScanHistory } from './_handlers'

const scan = new Hono<{ Bindings: Env }>()

scan.post('/',        createScan)
scan.get('/:scanId',  getScan)
scan.get('/history',  listScanHistory)

export default scan
```

```ts
// backend/src/routes/scan/_handlers/create.scan.handler.ts
import { zValidator } from '@hono/zod-validator'
import { ScanRequestSchema } from '@brioela/shared'
import type { Context } from 'hono'
import type { Env } from '../../../types'

export const createScan = [
  zValidator('json', ScanRequestSchema),
  async (c: Context<{ Bindings: Env }>) => {
    const { upc } = c.req.valid('json')
    const userId = c.get('userId')

    const id = c.env.ORCHESTRATOR.idFromName(userId)
    const orchestrator = c.env.ORCHESTRATOR.get(id)
    return orchestrator.fetch(c.req.raw)
  },
]
```

```ts
// backend/src/routes/scan/_handlers/index.ts
export { createScan } from './create.scan.handler'
export { getScan } from './get.scan.handler'
export { listScanHistory } from './list.scan.handler'
```

```ts
// backend/src/routes/index.ts
import type { Hono } from 'hono'
import type { Env } from '../types'
import scan from './scan'
import recipes from './recipes'
import ground from './ground'
import order from './bela'
import map from './map'
import recall from './recall'
import auth from './auth'

export function mountRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api/scan', scan)
  app.route('/api/recipes', recipes)
  app.route('/api/ground', ground)
  app.route('/api/bela', order)
  app.route('/api/map', map)
  app.route('/api/recall', recall)
  app.route('/api/auth', auth)
}
```

---

## Hono Context Type Extension

The Hono context carries typed state injected by middleware. Declare it once and it flows through all handlers:

```ts
// backend/src/types.ts
import type { UserId } from '@brioela/shared'

export type Env = {
  Bindings: CloudflareBindings  // from wrangler-generated worker-configuration.d.ts
  Variables: {
    userId: UserId              // injected by auth middleware
    requestId: string           // injected by logging middleware
  }
}
```

Usage in handlers:

```ts
// c.get('userId') returns UserId — fully typed
const userId = c.get('userId')
```

---

## Zod Validation at Route Entry

Every route that accepts a body or query params validates with `@hono/zod-validator`. No raw `c.req.json()` without validation.

```ts
import { zValidator } from '@hono/zod-validator'
import { CreateRecipeSchema } from '@brioela/shared'

recipes.post(
  '/',
  zValidator('json', CreateRecipeSchema),
  async (c) => {
    const body = c.req.valid('json')  // body is CreateRecipe — fully typed
    // ...
  }
)

// Query params also validated
recipes.get(
  '/',
  zValidator('query', z.object({ limit: z.coerce.number().max(50).default(20) })),
  async (c) => {
    const { limit } = c.req.valid('query')  // limit is number
    // ...
  }
)
```

---

## Middleware Pattern

Each middleware is a standalone file. Middleware only does one thing.

```ts
// backend/src/middleware/auth.ts
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types'
import { verifyJwt } from '../lib/auth/verify-jwt'
import { asUserId } from '@brioela/shared'

export const authMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'UNAUTHORIZED' }, 401)

  const payload = await verifyJwt(token)
  if (!payload) return c.json({ error: 'UNAUTHORIZED' }, 401)

  c.set('userId', asUserId(payload.sub))
  await next()
}
```

---

## DO Access Pattern

Route handlers access DOs only via `c.env.DO_BINDING.idFromName(key)`. The key is always the userId (one DO per user). Never pool DOs or use random IDs.

```ts
// ✓ — always idFromName with userId
const id = c.env.ORCHESTRATOR.idFromName(userId)
const stub = c.env.ORCHESTRATOR.get(id)
return stub.fetch(c.req.raw)

// ✗ — never random IDs, never pooled
const id = c.env.ORCHESTRATOR.newUniqueId()  // wrong for user agents
```

---

## Response Format

All API responses use a consistent envelope:

```ts
// Success
c.json({ data: result }, 200)

// Error
c.json({ error: 'SCAN_NOT_FOUND', message: 'Scan result not found' }, 404)

// Created
c.json({ data: created }, 201)
```

Never return raw values at the top level. Always wrap in `{ data: ... }` or `{ error: ... }`.

The error middleware (see `11-error-handling.md`) handles unhandled exceptions and formats them into this envelope automatically.

---

## RPC Type Export

Export `AppType` from the root for use in the mobile API client (Hono RPC):

```ts
// backend/src/index.ts — add to existing exports
export type AppType = typeof app
```

This enables fully typed API calls from the mobile app without any manual type duplication (see `10-mobile-api-layer.md`).
