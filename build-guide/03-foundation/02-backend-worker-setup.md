# Foundation — Backend Worker Setup

## What Goes Here

`backend/` is a Cloudflare Worker. It runs Hono as the HTTP layer, mounts all routes, exports all Durable Object classes, and validates environment variables at startup.

---

## `wrangler.jsonc`

```jsonc
{
  "name": "brioela",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-06",
  "compatibility_flags": ["nodejs_compat", "nodejs_compat_populate_process_env"],

  "observability": {
    "logs": {
      "enabled": true,
      "head_sampling_rate": 1,
      "invocation_logs": true
    }
  },

  // Production only — no workers.dev subdomain
  "workers_dev": false,
  "preview_urls": false,

  "routes": [
    {
      "pattern": "api.brioela.com/*",
      "zone_name": "brioela.com"
    }
  ],

  // Durable Object bindings — one per DO class
  "durable_objects": {
    "bindings": [
      { "name": "ORCHESTRATOR",   "class_name": "BrioelOrchestrator" },
      { "name": "COOKING_AGENT",  "class_name": "CookingAgent" }
    ]
  },

  // SQLite migrations — required for every DO that uses Drizzle SQLite
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["BrioelOrchestrator", "CookingAgent"]
    }
  ]
}
```

`nodejs_compat` makes `process.env`, `node:crypto`, and Node.js built-ins available inside the Worker. `nodejs_compat_populate_process_env` makes CF secrets and vars available via `process.env`.

---

## `backend/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target":          "es2022",
    "lib":             ["es2022"],
    "module":          "es2022",
    "moduleResolution": "bundler",
    "types":           ["@cloudflare/workers-types/2023-07-01"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx":             "react-jsx",
    "jsxImportSource": "hono/jsx",
    "noEmit":          true,
    "baseUrl":         ".",
    "paths": {
      "@/*":               ["src/*"],
      "@brioela/shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "worker-configuration.d.ts"],
  "exclude": ["test"]
}
```

---

## `backend/package.json`

```json
{
  "name": "@brioela/backend",
  "private": true,
  "scripts": {
    "dev":    "wrangler dev",
    "deploy": "wrangler deploy",
    "types":  "wrangler types"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.x",
    "typescript":                "^5.x",
    "wrangler":                  "^4.x"
  },
  "dependencies": {
    "agents":              "latest",
    "@google/genai":       "^1.x",
    "@anthropic-ai/sdk":   "latest",
    "@supabase/supabase-js": "^2.x",
    "@upstash/redis":      "^1.x",
    "@upstash/qstash":     "^2.x",
    "@upstash/workflow":   "latest",
    "drizzle-orm":         "^0.44.x",
    "hono":                "^4.x",
    "@hono/zod-validator": "latest",
    "postgres":            "^3.x",
    "nanoid":              "^5.x",
    "dayjs":               "^1.x",
    "stripe":              "^20.x",
    "resend":              "^6.x",
    "zod":                 "^4.x"
  }
}
```

---

## `src/index.ts` — Hono App Root

This file is the Worker entry point. It does three things: mounts routes, exports DO classes, exports `AppContext`.

```ts
// src/index.ts
import { Hono, type Context } from 'hono'
import { API_ROUTES } from '@brioela/shared/routes'
import { corsMiddleware }  from '@/core/middleware/cors.middleware'
import { authMiddleware }  from '@/core/middleware/auth.middleware'
import { errorMiddleware } from '@/core/middleware/error.middleware'

// CF requires all DO classes exported from the Worker entry point
export { BrioelOrchestrator } from './agents/orchestrator/orchestrator.agent'
export { CookingAgent }       from './agents/cooking/cooking.agent'

export const app = new Hono<{
  Variables: {
    userId:    UserId   // set by auth middleware after JWT validation
    requestId: string   // set by logging middleware
  }
}>()

app.use('*', corsMiddleware)
app.onError(errorMiddleware)
app.use('/api/*', authMiddleware)

// Routes — all paths come from shared, never raw strings
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

`AppContext` is derived — never manually declared. All handlers import it from `@/index`.

---

## Environment Variables — `src/core/config/env.ts`

All env vars are declared once and Zod-validated at startup. If any var is missing, the Worker fails fast with a clear error.

```ts
// src/core/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  SUPABASE_URL:              z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  DATABASE_URL:              z.url(),

  // AI
  GEMINI_API_KEY:    z.string(),
  ANTHROPIC_API_KEY: z.string(),

  // Upstash
  UPSTASH_REDIS_REST_URL:   z.url(),
  UPSTASH_REDIS_REST_TOKEN:  z.string(),
  QSTASH_URL:                z.url(),
  QSTASH_TOKEN:              z.string(),
  QSTASH_CURRENT_SIGNING_KEY: z.string(),
  QSTASH_NEXT_SIGNING_KEY:   z.string(),

  // Stripe (Bela escrow + shopper payouts)
  STRIPE_SECRET_KEY:         z.string(),
  STRIPE_WEBHOOK_SECRET:     z.string(),

  // Push notifications
  ONESIGNAL_APP_ID:          z.string(),
  ONESIGNAL_REST_API_KEY:    z.string(),

  // Email
  RESEND_API_KEY:            z.string(),

  // Auth
  JWT_SECRET:                z.string(),

  // Environment
  ENVIRONMENT: z.enum(['production', 'development']),
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)
if (!result.success) {
  console.error('Invalid environment variables:', result.error.format())
  throw new Error('Invalid environment variables')
}

export const env = result.data

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
```

Local dev: secrets live in `backend/.dev.vars` (gitignored). CF dashboard: set as Worker secrets.

---

## `.dev.vars` (local dev — gitignored)

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...
RESEND_API_KEY=re_...
JWT_SECRET=...
ENVIRONMENT=development
```

---

## CORS — `src/core/middleware/cors.middleware.ts`

```ts
import { cors } from 'hono/cors'
import { ALLOWED_CORS_ORIGINS } from '@brioela/shared/constants'

export const corsMiddleware = cors({
  origin:         ALLOWED_CORS_ORIGINS,
  allowMethods:   ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders:   ['Content-Type', 'Authorization'],
  credentials:    true,
  maxAge:         86400,
})
```

`ALLOWED_CORS_ORIGINS` lives in `shared/constants/cors/cors.constant.ts` — a string array of allowed origins.

---

## Auth Middleware — `src/core/middleware/auth.middleware.ts`

```ts
import type { MiddlewareHandler } from 'hono'
import type { AppContext } from '@/index'
import { createClient } from '@supabase/supabase-js'
import { asUserId } from '@brioela/shared'

export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'UNAUTHORIZED' }, 401)

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) return c.json({ error: 'UNAUTHORIZED' }, 401)

  c.set('userId', asUserId(user.id))
  await next()
}
```

`userId` is set as a branded `UserId` type — never a raw string. All handlers access it via `c.get('userId')` with full type safety.

---

## Error Middleware — `src/core/middleware/error.middleware.ts`

```ts
import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import { AppError } from '@brioela/shared'

export const errorMiddleware: ErrorHandler = (e, c) => {
  if (e instanceof AppError) {
    return c.json({ error: e.code, message: e.message }, e.statusCode as never)
  }
  if (e instanceof ZodError) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Validation failed', details: e.issues }, 422)
  }
  console.error('[UNHANDLED]', e)
  return c.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500)
}
```

---

## Response Envelope — `src/core/response.ts`

```ts
export function apiSuccessResponse<T>(data: T) {
  return { data }
}
```

Controllers always wrap handler output in `apiSuccessResponse`. The mobile client unwraps `response.data`. Errors follow `{ error, message }` — no `data` key.

---

## Third-Party Clients — `src/core/clients/`

One file per client. Each client is instantiated once and reused.

```ts
// src/core/clients/redis.client.ts
import { Redis } from '@upstash/redis'
export const redis = new Redis({
  url:   env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

// src/core/clients/qstash.client.ts
import { Client as QStashClient } from '@upstash/qstash'
export const qstash = new QStashClient({ token: env.QSTASH_TOKEN })

// src/core/clients/supabase.client.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// src/core/clients/gemini.client.ts
import { GoogleGenAI } from '@google/genai'
export const gemini = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

// src/core/clients/resend.client.ts
import { Resend } from 'resend'
export const resend = new Resend(env.RESEND_API_KEY)
```
