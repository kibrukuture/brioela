# Platform Foundation — Build

Feature **01**. Monorepo root, backend shell, shared contract, Postgres Drizzle spine, DO SQLite adapter, wrangler bindings, guard tooling.

---

## Root workspace (`package.json`)

| Script cluster | Role |
|---|---|
| `name:*`, `type:*`, `lexicon:*` | Guard daemons + baselines |
| `gate:*` | Reading gate for agent doc compliance |
| `guard:*` | Combined guard orchestration |
| `deploy:backend` | `fly deploy -c backend/fly.toml` (**fly.toml missing — G15**) |
| `deploy:pdf-converter`, `deploy:universal-file-converter` | Adjacent Fly services (not Brioela product core) |

Workspaces: `backend`, `shared`, `mobile`, `tools/brioela-{name,type,lexicon}-guard`, `tools/brioela-guard`.

---

## Backend package (`backend/package.json`)

| Script | Role |
|---|---|
| `dev` | `bun --watch --preload ./src/instrument.ts ./src/index.ts` |
| `build` | `bun build src/index.ts --outdir=dist --target=node` |
| `start` | `bun --preload instrument.ts ./dist/index.js` |
| `dep` | `npx wrangler deploy` |
| `brain:*` | Brain DO scripts (owned by **04**, live in same package) |

Package name: `@brioela/api` (guide: `@brioela/backend`).

---

## Wrangler (`backend/wrangler.jsonc`)

```jsonc
"durable_objects": {
  "bindings": [{ "name": "BRIOELA_BRAIN", "class_name": "BrioelaBrain" }]
},
"migrations": [{
  "tag": "brioela_brain_v1",
  "new_sqlite_classes": ["BrioelaBrain"]
}],
"routes": [{ "pattern": "api.brioela.com/*", "zone_name": "brioela.com" }]
```

No `MiraSession` binding yet.

---

## Worker entry + app assembly

| File | Role |
|---|---|
| `src/index.ts` | Export `BrioelaBrain`, default Hono `app`, `AppContext` type |
| `src/instrument.ts` | Sentry Node init (preload) |
| `src/app/create.app.handler.ts` | Instantiate Hono, mount middleware + routes |
| `src/app/mount.middleware.handler.ts` | CORS, `onError`, auth with skip list |
| `src/app/mount.routes.handler.ts` | Mount all feature routers |
| `src/app/context.type.ts` | `AppEnvironment`, `AppContext` |

---

## Core middleware

| File | Role |
|---|---|
| `core/middleware/cors.ts` | `createCors()` from `ALLOWED_CORS_ORIGINS` |
| `core/middleware/auth.ts` | Supabase JWT + `userId` query param match |
| `core/middleware/error-handler.ts` | `HTTPException` + normalized unknown errors |
| `core/middleware/health-check.ts` | Health endpoint handler |

---

## Core config + database

| File | Role |
|---|---|
| `core/config/env.ts` | Zod `envSchema`, exported `env` |
| `core/database/client.ts` | `getDb()` — `pg.Pool` + Drizzle |
| `core/database/supabase-admin-client.ts` | Supabase service role (auth) |

---

## Response helpers

| File | Role |
|---|---|
| `lib/response.ts` | `apiSuccessResponse`, `apiPaginatedResponse`, `apiErrorResponse` |

---

## Shared DO SQLite adapter (platform)

| File | Role |
|---|---|
| `database/sqlite/_database/durable.sqlite.database.ts` | Drizzle durable-sqlite re-exports |
| `database/sqlite/_migrations/apply.durable.sqlite.migration.helper.ts` | `applyDurableSqliteMigration()` wrapper |

Used by Brain (04) and future SQLite DOs.

---

## Message queue (QStash ingress)

| File | Role |
|---|---|
| `message-queue/queue.routes.ts` | Verified QStash POST handlers |
| `message-queue/verify.ts` | Signature verification |

---

## Shared package

| File / folder | Role |
|---|---|
| `package.json` | `db:gen`, `db:mig`, `db:mig:run`, drizzle-kit |
| `drizzle.config.ts` | Postgres kit config, `schemaFilter: ['brioela']` |
| `drizzle/schema/brioela.ts` | `pgSchema('brioela')` |
| `drizzle/schema/index.ts` | Schema barrel (currently fintech tables) |
| `drizzle/migrate.ts` | Node migrator runner |
| `api/index.ts` | `API_ROUTES`, `API_ROUTE_PATTERNS` assembly |
| `api/*.routes.ts` | Per-domain route constants |
| `api/allowed-cors-origins.ts` | CORS allowlist |
| `api/no-middleware-check.routes.ts` | Auth skip list |
| `validators/*.ts` | Zod schemas per domain |
| `types/api.ts` | Response envelopes + `ErrorCode` |
| `zod/index.ts` | Zod v4 re-export |
| `constants/urls.ts` | `PUBLIC_API_BASE_URL`, webhook URLs |

---

## Guard tools (`tools/`)

| Package | Role |
|---|---|
| `brioela-name-guard` | Filename/folder enforcement |
| `brioela-type-guard` | Type policy enforcement |
| `brioela-lexicon-guard` | Vocabulary enforcement |
| `brioela-guard` | Combined check/watch |
| `brioela-reading-gate` | Agent reading gate |
| `brioela-brain-migration-manifest` | Brain SQL bundle generator (**04**) |

---

## Build order (recommended)

1. **Root workspace** — `bun install`, verify workspaces resolve.
2. **Shared Postgres** — `cd shared && bun run db:gen` / `db:mig:run` when schema changes.
3. **Shared contract** — add route + validator modules before backend handlers.
4. **Backend shell** — env schema, middleware, mount new routers.
5. **Wrangler** — add DO bindings + `new_sqlite_classes` before any new SQLite agent ships.
6. **DO adapter** — reuse `database/sqlite/` helpers in new agents.
7. **Deploy path** — resolve CF vs Node hosting (G2, G14, G15) before production cutover.
8. **Mobile** — point `PUBLIC_URLS` at API, migrate axios → fetch (**02**/01 gap).

---

## Acceptance criteria

### Monorepo
- [x] Bun workspaces: `backend`, `shared`, `mobile`
- [x] Root tsconfig strict baseline
- [ ] Root `@brioela/shared` path aliases per `02-typescript-strictness.md` (G16)
- [x] Guard tooling installable from root scripts

### Backend shell
- [x] Hono app with separated mount handlers
- [x] CORS + global error handler + auth middleware
- [x] Routes mounted from `API_ROUTES.*.base`
- [x] Zod env validation at import
- [ ] `AppContext` uses branded `UserId` (G4)
- [ ] Product `/api/*` routers from build guide (G17)
- [ ] HTTP handlers call DOs via `idFromName(userId)` (G6)
- [ ] Single deploy target documented and working (G2, G14, G15)

### Shared
- [x] `API_ROUTES` + `API_ROUTE_PATTERNS` pattern
- [x] Postgres `brioela` pgSchema + drizzle-kit config
- [ ] Root `shared/index.ts` barrel (G8)
- [ ] Folder names `routes/`, `validator/` OR documented permanent `api/`, `validators/` (G7)
- [ ] Brioela product Drizzle tables per `03-database.md` (G18)
- [ ] CORS + public URLs on `brioela.com` (G9)

### Data layer
- [x] `getDb()` Drizzle postgres client
- [x] Shared durable-sqlite migrator helper
- [ ] Supabase client `schema: 'brioela'` aligned with Drizzle (G10)
- [ ] Worker-safe connection strategy if staying on CF (G11)

### DO platform
- [x] `BrioelaBrain` exported from `index.ts`
- [x] `BRIOELA_BRAIN` + `new_sqlite_classes` in wrangler
- [ ] `MiraSession` export + migration (G3)
- [ ] Registry pattern doc for N DO classes (future Bela, cooking)

### Mobile foundation
- [x] Expo app workspace exists
- [ ] Fetch-based network client per `05-mobile-setup.md` (G12)
- [ ] `EXPO_PUBLIC_API_URL` → `api.brioela.com` (G9)

### Packages policy
- [ ] Remove `ioredis` or document exception (G12)
- [ ] Add `@upstash/workflow` when workflow features ship (G13)

---

## Not in this feature (downstream)

| Area | Feature |
|---|---|
| Auth onboarding UX | 03 |
| Design tokens / NativeWind product palette | 02 |
| Brain DO class + migrations | 04 |
| Brioela product API modules (scan, ground, …) | 24–54 |
| Mira session DO + RealtimeKit | 20, 29, 30 |

---

## Draft folder

`draft/` contains **29** `.md` snapshots — root/backend/shared/mobile entrypoints, wrangler, env, middleware, database clients, SQLite adapter, route index. See count in `status.md`.
