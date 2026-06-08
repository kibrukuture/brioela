# Backend — Hono Patterns

## App Root

`backend/src/index.ts` is the Hono app root and the Cloudflare Worker entry point. It mounts all routes using `API_ROUTES.{feature}.base` from shared — no raw URL strings ever. It also exports all DO classes (required by Cloudflare).

```ts
// backend/src/index.ts
import { Hono, type Context } from 'hono'
import { API_ROUTES } from '@brioela/shared/routes'
import { corsMiddleware } from '@/core/middleware/cors.middleware'
import { authMiddleware } from '@/core/middleware/auth.middleware'
import { errorMiddleware } from '@/core/middleware/error.middleware'

// DO exports — CF requires all DO classes exported from the worker entry point
export { BrioelOrchestrator } from './agents/orchestrator'
export { CookingAgent } from './agents/cooking'

export const app = new Hono<{
  Variables: {
    userId: UserId
    requestId: string
  }
}>()

app.use('*', corsMiddleware)
app.onError(errorMiddleware)
app.use('/api/*', authMiddleware)

// All routes mounted via typed API_ROUTES — never raw strings
app.route(API_ROUTES.scan.base,          scanRouter)
app.route(API_ROUTES.recipes.base,       recipesRouter)
app.route(API_ROUTES.ground.base,        groundRouter)
app.route(API_ROUTES.map.base,           mapRouter)
app.route(API_ROUTES.bela.base,          belaRouter)
app.route(API_ROUTES.recall.base,        recallRouter)
app.route(API_ROUTES.auth.base,          authRouter)
app.route(API_ROUTES.notifications.base, notificationsRouter)

export default app
export type AppContext = typeof app extends Hono<infer E> ? Context<E> : never
```

---

## The Three-Layer Stack

Every feature endpoint flows through three layers. Each layer has exactly one job.

```
scan.route.ts        — registers the path from ROUTE_PATTERNS, points to controller
scan.controller.ts   — on{Action}(): calls handler, wraps result in apiSuccessResponse
_handlers/create.scan.handler.ts — pure logic: reads context, hits DB/DO, returns data
```

---

## Route Files

Route files register paths using `API_ROUTE_PATTERNS` from shared — never raw strings. All handler logic is in the controller, never in the route file.

```ts
// backend/src/api/scan/scan.route.ts
import { Hono } from 'hono'
import { API_ROUTE_PATTERNS } from '@brioela/shared/routes'
import * as controller from './scan.controller'
import type { AppContext } from '@/index'

const scanRouter = new Hono<AppContext>()

// Paths come from shared — never written as raw strings
scanRouter.post(API_ROUTE_PATTERNS.scan.create,      controller.onCreateScan)
scanRouter.get(API_ROUTE_PATTERNS.scan.getById,       controller.onGetScan)
scanRouter.get(API_ROUTE_PATTERNS.scan.listHistory,   controller.onListScanHistory)

export default scanRouter
```

---

## Controller Files

Controllers are the HTTP layer. Each `on{Action}` function does exactly one thing: call the handler and return `c.json(apiSuccessResponse(result))`. No business logic lives here.

```ts
// backend/src/api/scan/scan.controller.ts
import type { AppContext } from '@/index'
import * as handlers from './_handlers'
import { apiSuccessResponse } from '@/core/response'

export async function onCreateScan(c: AppContext) {
  const result = await handlers.createScan(c)
  return c.json(apiSuccessResponse(result), 201)
}

export async function onGetScan(c: AppContext) {
  const result = await handlers.getScan(c)
  return c.json(apiSuccessResponse(result))
}

export async function onListScanHistory(c: AppContext) {
  const result = await handlers.listScanHistory(c)
  return c.json(apiSuccessResponse(result))
}
```

---

## Handler Files

Handlers contain all business logic. They receive `AppContext`, do the work, and **return plain data** — never `c.json`. The controller handles response formatting.

```ts
// backend/src/api/scan/_handlers/create.scan.handler.ts
import { zValidator } from '@hono/zod-validator'
import { CreateScanSchema } from '@brioela/shared'
import type { AppContext } from '@/index'

export async function createScan(c: AppContext) {
  const userId = c.get('userId')
  const body   = await c.req.json()

  const { upc } = CreateScanSchema.parse(body)

  const id = c.env.ORCHESTRATOR.idFromName(userId)
  const orchestrator = c.env.ORCHESTRATOR.get(id)
  const scan = await orchestrator.fetch(c.req.raw).then(r => r.json())

  // return plain data — controller wraps in apiSuccessResponse
  return { scan }
}
```

```ts
// backend/src/api/scan/_handlers/index.ts
export { createScan }       from './create.scan.handler'
export { getScan }          from './get.scan.handler'
export { listScanHistory }  from './list.scan.handler'
```

---

## Shared Route Definitions

Route paths are defined once in `shared/routes/{feature}.routes.ts` and imported everywhere. Two objects per file:

```ts
// shared/routes/scan.routes.ts
export const SCAN_ROUTES = {
  base:        '/api/scan',
  create:      () => '/api/scan',
  getById:     (id: string) => `/api/scan/${id}`,
  listHistory: () => '/api/scan/history',
} as const

// ROUTE_PATTERNS use Hono :param syntax — mounted on the router after base is stripped
export const SCAN_ROUTE_PATTERNS = {
  create:      '/',
  getById:     '/:scanId',
  listHistory: '/history',
} as const
```

```ts
// shared/routes/index.ts
import { SCAN_ROUTES, SCAN_ROUTE_PATTERNS }     from './scan.routes'
import { RECIPE_ROUTES, RECIPE_ROUTE_PATTERNS } from './recipe.routes'
// ...

export const API_ROUTES = {
  scan:    SCAN_ROUTES,
  recipes: RECIPE_ROUTES,
  // ...
} as const

export const API_ROUTE_PATTERNS = {
  scan:    SCAN_ROUTE_PATTERNS,
  recipes: RECIPE_ROUTE_PATTERNS,
  // ...
} as const
```

Backend uses `API_ROUTE_PATTERNS`. Mobile uses `API_ROUTES`. Neither writes raw strings.

---

## Hono Context Type

`AppContext` is derived from the Hono app instance — no duplication:

```ts
// backend/src/index.ts
export const app = new Hono<{
  Bindings: Env
  Variables: {
    userId:    UserId   // injected by auth middleware
    requestId: string   // injected by logging middleware
  }
}>()

export type AppContext = typeof app extends Hono<infer E> ? Context<E> : never
```

All handlers import `AppContext` from `@/index`. `c.get('userId')` returns `UserId` — fully typed.

---

## Middleware Pattern

Each middleware lives in `core/middleware/` — one file, one concern:

```ts
// backend/src/core/middleware/auth.middleware.ts
import type { MiddlewareHandler } from 'hono'
import type { AppContext } from '@/index'
import { supabase } from '@/core/auth/supabase.server'
import { asUserId } from '@brioela/shared/types'

export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'UNAUTHORIZED' }, 401)

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return c.json({ error: 'UNAUTHORIZED' }, 401)

  c.set('userId', asUserId(data.user.id))
  await next()
}
```

---

## DO Access Pattern

Route handlers access DOs only via `c.env.DO_BINDING.idFromName(userId)`. Always `idFromName` — one DO per user. Never `newUniqueId`.

```ts
// ✓ — always idFromName with userId
const id = c.env.ORCHESTRATOR.idFromName(userId)
const stub = c.env.ORCHESTRATOR.get(id)
return stub.fetch(c.req.raw)

// ✗ — never random IDs
const id = c.env.ORCHESTRATOR.newUniqueId()
```

---

## Response Format

`apiSuccessResponse` wraps handler data in the standard envelope. The controller always uses it — handlers never touch `c.json`.

```ts
// backend/src/core/response.ts
export function apiSuccessResponse<T>(data: T) {
  return { data }
}

// Success: { data: result }
// Error (from error middleware): { error: 'SCAN_NOT_FOUND', message: '...' }
```
