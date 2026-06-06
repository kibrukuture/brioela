# Foundation — Shared Package Setup

## What `shared/` Is

`shared/` is the single contract between backend and mobile. It is the only place where:
- Zod validators and inferred types live
- Route URL strings are defined
- Constants shared across both sides live
- Drizzle table schemas live (Supabase Postgres)

No `src/` wrapper. All folders sit directly under `shared/`.

---

## Folder Layout

```
shared/
├── validator/              ← Zod schemas + inferred types — scoped by domain
├── routes/                 ← ROUTES (full URLs) + ROUTE_PATTERNS (Hono patterns)
├── constants/              ← Shared constant values
├── drizzle/                ← Supabase Postgres schema + migrations
│   ├── schema/
│   │   ├── brioela.ts      ← pgSchema('brioela')
│   │   ├── _shared.schema.ts
│   │   ├── user.schema.ts
│   │   ├── products.schema.ts
│   │   ├── community.schema.ts
│   │   ├── map.schema.ts
│   │   ├── bela.schema.ts
│   │   ├── recall.schema.ts
│   │   └── index.ts
│   ├── migrations/
│   └── migrate.ts
├── drizzle.config.ts
├── index.ts                ← root barrel — everything public
├── tsconfig.json
└── package.json
```

---

## `shared/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@brioela/shared/*": ["./*"]
    }
  }
}
```

---

## `shared/package.json`

```json
{
  "name": "@brioela/shared",
  "module": "index.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "db:gen":     "drizzle-kit generate",
    "db:mig":     "drizzle-kit migrate",
    "db:push":    "drizzle-kit push",
    "db:studio":  "drizzle-kit studio"
  },
  "devDependencies": {
    "@types/bun":  "latest",
    "drizzle-kit": "^0.31.x",
    "typescript":  "^5.x"
  },
  "dependencies": {
    "drizzle-orm": "^0.44.x",
    "zod":         "^4.x"
  }
}
```

---

## Routes — `shared/routes/`

Each feature has one `.routes.ts` file. It exports two `as const` objects — full URLs for mobile, Hono path patterns for backend.

```ts
// shared/routes/scan.routes.ts
export const SCAN_ROUTES = {
  base:        '/api/scan',
  create:      () => '/api/scan',
  getById:     (id: string) => `/api/scan/${id}`,
  listHistory: () => '/api/scan/history',
} as const

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
import { GROUND_ROUTES, GROUND_ROUTE_PATTERNS } from './ground.routes'
import { MAP_ROUTES, MAP_ROUTE_PATTERNS }       from './map.routes'
import { BELA_ROUTES, BELA_ROUTE_PATTERNS }     from './bela.routes'
import { RECALL_ROUTES, RECALL_ROUTE_PATTERNS } from './recall.routes'
import { AUTH_ROUTES, AUTH_ROUTE_PATTERNS }     from './auth.routes'
import { NOTIFICATIONS_ROUTES, NOTIFICATIONS_ROUTE_PATTERNS } from './notifications.routes'

export const API_ROUTES = {
  scan:          SCAN_ROUTES,
  recipes:       RECIPE_ROUTES,
  ground:        GROUND_ROUTES,
  map:           MAP_ROUTES,
  bela:          BELA_ROUTES,
  recall:        RECALL_ROUTES,
  auth:          AUTH_ROUTES,
  notifications: NOTIFICATIONS_ROUTES,
} as const

export const API_ROUTE_PATTERNS = {
  scan:          SCAN_ROUTE_PATTERNS,
  recipes:       RECIPE_ROUTE_PATTERNS,
  ground:        GROUND_ROUTE_PATTERNS,
  map:           MAP_ROUTE_PATTERNS,
  bela:          BELA_ROUTE_PATTERNS,
  recall:        RECALL_ROUTE_PATTERNS,
  auth:          AUTH_ROUTE_PATTERNS,
  notifications: NOTIFICATIONS_ROUTE_PATTERNS,
} as const
```

Backend uses `API_ROUTE_PATTERNS`. Mobile uses `API_ROUTES`. Neither writes raw URL strings.

---

## Validators — `shared/validator/`

One scope folder per domain. Inside each scope: individual files, each with one concern. File suffix is always a category word (`.schema.ts`, `.type.ts`, `.event.ts`, `.job.ts`). Each scope folder has `index.ts`.

```
shared/validator/
├── user/
│   ├── user.schema.ts        ← UserSchema → type User
│   ├── user.id.type.ts       ← all branded IDs + as*() constructors
│   └── index.ts
├── scan/
│   ├── scan.schema.ts        ← ScanEventSchema, ScanVerdictSchema, VerdictLevelSchema
│   ├── create.scan.schema.ts ← CreateScanSchema → type CreateScan
│   └── index.ts
├── recipe/
│   ├── recipe.schema.ts
│   ├── import.recipe.schema.ts
│   ├── import.recipe.job.ts
│   └── index.ts
├── error/
│   ├── app.error.type.ts     ← AppError class, ErrorCode, errors factory
│   └── index.ts
└── result/
    ├── result.type.ts        ← Result<T,E>, ok(), err()
    └── index.ts
```

All types are `z.output<typeof SomeSchema>` — never manually declared alongside a schema.

---

## Constants — `shared/constants/`

```
shared/constants/
├── cors/
│   └── cors.constant.ts      ← ALLOWED_CORS_ORIGINS
├── verdict/
│   └── verdict.constant.ts   ← VERDICT_LEVEL, VERDICT_COLORS
├── tiers/
│   └── tiers.constant.ts     ← SUBSCRIPTION_TIERS
└── index.ts
```

---

## Root Barrel — `shared/index.ts`

Controls exactly what is public. Everything not exported here is internal to the package.

```ts
// shared/index.ts

// Validators — all types derive from here
export * from './validator/user'
export * from './validator/scan'
export * from './validator/recipe'
export * from './validator/constraint'
export * from './validator/ground'
export * from './validator/bela'
export * from './validator/recall'
export * from './validator/error'
export * from './validator/result'

// Routes
export * from './routes'

// Constants
export * from './constants'
```

Both backend and mobile import from `@brioela/shared` — never from subpaths inside `shared/`.

---

## Rules

- Never duplicate a schema. If a shape crosses the network boundary, it lives here.
- Never manually redeclare a type that can be `z.output<>`.
- No side effects, no API calls, no `process.env` access in `shared/`. Pure structure.
- `drizzle.config.ts` always points to `drizzle/schema/index.ts` — never individual files.
