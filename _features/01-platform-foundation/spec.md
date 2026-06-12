# Platform Foundation — Spec

Feature **01**. Monorepo skeleton, backend HTTP shell, shared contract package, Postgres + DO SQLite data foundations, Durable Object export surface, and deployment wiring. Every numbered feature (03–54) assumes this layer exists.

---

## Purpose

Platform foundation owns what must exist before product features ship:

1. **Monorepo workspaces** — `backend`, `shared`, `mobile`, and `tools/*` guard packages under one Bun workspace root.
2. **Backend Worker entry** — Hono app assembly, middleware stack, route mounting, Cloudflare DO class exports.
3. **Shared contract** — route constants, Zod validators, Postgres Drizzle schemas, cross-cutting constants.
4. **Data layer split** — Supabase Postgres (`brioela` schema) for shared cross-user data; per-user DO SQLite via Drizzle `durable-sqlite` (Brain and future agents).
5. **Platform DO patterns** — `idFromName(userId)` addressing, `new_sqlite_classes` in wrangler migrations, shared SQLite migrator adapter.
6. **Env + clients** — Zod-validated `process.env`, Supabase auth admin, Postgres pool, Upstash Redis/QStash hooks.

This is **not** auth UX (03), design system (02), or Brain product logic (04+). It is the attach point for all of them.

---

## Architecture (four layers)

```text
Mobile / clients
        │
        ▼ HTTP (Bearer + userId query param today)
Backend Hono shell (stateless router)
        │
        ├──► Supabase Postgres via Drizzle (shared data)
        ├──► Upstash Redis / QStash (cache, async jobs)
        ├──► Third-party clients (Stripe, OneSignal, R2, …)
        └──► Durable Objects via env bindings (BRIOELA_BRAIN, future MiraSession)
                 │
                 └──► Per-DO Drizzle SQLite (private user data)
```

Hard doctrine (from `brioela-specs/24-technical-architecture-backbone.md` + `build-guide/03-foundation/03-database.md`):

- Single Hono router in one Worker — all routes mounted from shared route constants, no raw URL strings in handlers.
- All DO classes exported from `backend/src/index.ts` (Cloudflare requirement).
- `[[migrations]]` / `migrations` with `new_sqlite_classes` for every SQLite-backed DO.
- Workers are stateless front doors — route to the correct user's DO via `env.BINDING.idFromName(userId)`.
- Supabase Postgres: shared cross-user data only. User-private behavioral data lives in DO SQLite.
- Production code does not call `ctx.storage.sql` or raw SQL — Drizzle repositories only (Brain enforced in 04; platform provides shared adapter).

---

## Monorepo structure (intended vs shipped)

### Intended (`build-guide/03-foundation/01-monorepo-setup.md`)

```text
brioela/
├── backend/          @brioela/backend
├── shared/           @brioela/shared
├── mobile/           @brioela/mobile
├── package.json      workspaces: backend, shared, mobile
├── tsconfig.json     base strict config + @brioela/shared paths
└── bun.lock
```

Root `dependencies` empty. Dev scripts: `dev:backend`, `dev:mobile`.

### Shipped (evidence: root `package.json`)

- Workspaces: `backend`, `shared`, `mobile`, plus `tools/brioela-{name-guard,type-guard,lexicon-guard,guard}`.
- Root scripts dominated by **guard daemons** (name, type, lexicon, reading-gate) — not in foundation build guide.
- Root has `dotenv` dependency (CLAUDE.md says Bun loads `.env` — drift).
- `deploy:backend` points at `fly deploy -c backend/fly.toml` but **`backend/fly.toml` does not exist** in repo (G15).
- Package name `brioela` not `brioela-monorepo` (cosmetic drift).

---

## Backend Worker shell (intended vs shipped)

### Intended (`build-guide/03-foundation/02-backend-worker-setup.md`)

- `backend/package.json` name `@brioela/backend`.
- `wrangler.jsonc`: bindings `BRAIN`, `MIRA_SESSION`; migration tag `v1` with both SQLite classes.
- `src/index.ts`: inline Hono app, mount `API_ROUTES.scan|recipes|ground|…`, export `BrioelaBrain`, `MiraSession`.
- `AppContext` derived from Hono instance with `userId: UserId` branded variable.
- Routes under `/api/*` prefix.
- `dev` script: `wrangler dev`. Deploy: `wrangler deploy`.

### Shipped (evidence: `backend/src/`)

**Entry split** — cleaner than guide sample:

| File | Role |
|---|---|
| `src/index.ts` | CF entry: export `BrioelaBrain`, default `app`, `AppContext` type |
| `src/app/create.app.handler.ts` | `new Hono()`, call mount helpers |
| `src/app/mount.middleware.handler.ts` | CORS, error handler, auth with skip list |
| `src/app/mount.routes.handler.ts` | Mount all feature routers from `API_ROUTES` |

**Package name:** `@brioela/api` not `@brioela/backend` (G1).

**Runtime target:** `bun build … --target=node`, `@sentry/node` in `instrument.ts`, `pg` Pool with `maxUses: 1` comment "for Cloudflare Workers" — indicates **dual-target / migration-in-progress** between Node hosting and CF Workers (G2).

**Wrangler** (`backend/wrangler.jsonc`):

- Binding: `BRIOELA_BRAIN` → `BrioelaBrain` (guide sample used `BRAIN` — production naming wins).
- Only one DO class migrated; **no `MiraSession`** (G3).
- Route: `api.brioela.com/*` (guide matches; comment still says `api.schnl.com` — stale comment).
- `compatibility_date`: `2026-06-03`.

**Mounted routes** (Schnl/fintech era, not Brioela product routes from build guide):

`users`, `devices`, `cardControls`, `cards`, `maps`, `webhooks`, `queue`, `payments`, `notifications`, `inAppNotifications`, `availability`, `banking`, `communicationCode`, `stressTest`, health check.

**Missing from build-guide product list:** `scan`, `recipes`, `ground`, `map` (Brioela), `bela`, `recall`, `auth` (as separate router — auth paths exist under `/v1/auth/*` skip list).

**AppContext** (`context.type.ts`): `Variables.user: { id, email }` — **not** branded `UserId` (G4).

**Auth middleware** (`core/middleware/auth.ts`):

- Supabase `getUser(token)` validation.
- Requires `userId` query param matching token subject (legacy Schnl pattern).
- Sets `c.set('user', …)` not `c.set('userId', asUserId(…))`.

**Response envelope** (`lib/response.ts`): `{ data, meta: { timestamp, requestId } }` — richer than guide's `{ data }` only (G5).

**DO wiring from HTTP:** `rg BRIOELA_BRAIN backend/src/api` — **zero matches**. Brain DO exists but API routes do not call it yet (G6). Feature 04 ledger confirms same gap.

---

## Shared package (intended vs shipped)

### Intended (`build-guide/03-foundation/04-shared-package-setup.md`)

```text
shared/
├── validator/     Zod per domain
├── routes/        ROUTES + ROUTE_PATTERNS → API_ROUTES
├── constants/
├── drizzle/       Postgres brioela schema
└── index.ts       root barrel
```

Product domains: scan, recipe, ground, map, bela, recall, auth, notifications.

### Shipped

| Intended path | Shipped path | Notes |
|---|---|---|
| `validator/` | `validators/` | plural (G7) |
| `routes/` | `api/` | different folder name (G7) |
| `index.ts` barrel | **no root `shared/index.ts`** | imports use `@brioela/shared/*` subpaths (G8) |
| Product route files | Banking/fintech routes | `banking.routes.ts`, `cards.routes.ts`, … |
| `ALLOWED_CORS_ORIGINS` in `constants/cors/` | `api/allowed-cors-origins.ts` | origins: `schnl.com` not `brioela.com` (G9) |
| `PUBLIC_API_BASE_URL` → `api.brioela.com` | `constants/urls.ts` → `api.schnl.com` (G9) |

**Zod re-export:** `shared/zod/index.ts` exports `zod/v4` — central entry for backend env parsing.

**Postgres schema** (`shared/drizzle/schema/`):

- `brioela.ts` defines `pgSchema('brioela')` — matches spec.
- `index.ts` aggregates **banking/fintech tables** (wallets, ledger, KYC, cards, …) plus `push_notification`, `devices`, `in-app-notification`.
- **No** Brioela product tables from build guide (`products`, `community`, `map`, `bela`, `recall` as specified in `03-database.md`).

**Supabase admin client** uses `schema: 'schnl'` with `@ts-ignore` — conflicts with `brioela` Drizzle schema name (G10).

---

## Database foundation

### Two Drizzle instances (spec doctrine — both partially shipped)

| Instance | Driver | Config | Schema location | Status |
|---|---|---|---|---|
| Supabase Postgres | `drizzle-orm/node-postgres` + `pg` Pool | `shared/drizzle.config.ts` | `shared/drizzle/schema/` | **Shipped** — migrations `0000`–`0005` |
| DO SQLite | `drizzle-orm/durable-sqlite` | `backend/brain.drizzle.config.ts` (Brain) | `backend/src/agents/brain/_schemas/` | **Owned by 04**; platform provides shared adapter |

### Postgres client (shipped)

`backend/src/core/database/client.ts`:

- `getDb()` creates `pg.Pool` from `DATABASE_CONNECTION_STRING`.
- Returns `drizzle({ client: pool, schema })` using shared schema barrel.
- Pool tuning: max 30, min 5 — **not** Worker-isolate friendly as written (G11).

### DO SQLite platform adapter (shipped)

Platform-level shared code under `backend/src/database/sqlite/`:

| File | Role |
|---|---|
| `_database/durable.sqlite.database.ts` | Re-export `drizzle` + `DrizzleSqliteDODatabase` type from `durable-sqlite` |
| `_migrations/apply.durable.sqlite.migration.helper.ts` | Typed wrapper around `drizzle-orm/durable-sqlite/migrator` `migrate()` |

Brain agent imports these — correct layering for future DOs.

### Migration commands (shared)

From `shared/package.json`:

```bash
bun run db:gen      # drizzle-kit generate
bun run db:mig      # drizzle-kit migrate
bun run db:mig:run  # tsx drizzle/migrate.ts (node-postgres migrator)
```

---

## Durable Object / agent hosting (platform level)

### Export contract

Cloudflare requires every DO class exported from Worker entry. Shipped:

```ts
export { BrioelaBrain } from '@/agents/brain'
```

`MiraSession`, `BelaOrderAgent`, cooking agents — **not exported** (G3).

### Wrangler SQLite provisioning

```jsonc
"migrations": [{ "tag": "brioela_brain_v1", "new_sqlite_classes": ["BrioelaBrain"] }]
```

Matches 04 production binding name `BRIOELA_BRAIN`.

### Addressing pattern (spec — not yet used from HTTP)

```ts
const id = env.BRIOELA_BRAIN.idFromName(userId)
const stub = env.BRIOELA_BRAIN.get(id)
```

Handlers should receive `userId` from auth context and never use `newUniqueId()`.

### Agents SDK

`agents` package in backend dependencies. `BrioelaBrain extends Agent<Cloudflare.Env, …>` — see feature 04 for class detail. Platform foundation owns **export + wrangler binding** only.

---

## Async job infrastructure (partial)

**QStash queue router** (`backend/src/message-queue/queue.routes.ts`):

- Mounted at `API_ROUTES.queue.base`.
- Signature verification middleware.
- Banking/email job handlers (Schnl era).

Upstash Redis client: `backend/src/core/clients/redis.ts` uses `@upstash/redis` with `REDIS_URL` / `REDIS_TOKEN`.

**Also in dependencies:** `ioredis` — banned by `build-guide/02-coding-standards/11-packages.md` (G12).

**Upstash Workflow:** listed in architecture spec; **no** `@upstash/workflow` in `backend/package.json` (G13).

---

## Mobile foundation (partial — legacy Schnl shell)

`build-guide/03-foundation/05-mobile-setup.md` describes Expo Router, NativeWind tokens, fetch-based `network/core/client.ts`, `useIsomorphicLayoutEffect`.

**Shipped mobile** exists (`mobile/` Expo app) but:

- Network client uses **axios** (`mobile/network/core/client.ts`) — banned (G12).
- API base URL points to `api.schnl.com` (G9).
- Feature folders are Schnl banking/KYC, not Brioela scanner/ground/map tabs from build guide.

Mobile foundation migration is **out of scope for full completion** in 01 — documented as partial; feature 02 owns design system alignment.

---

## Environment variables

`backend/src/core/config/env.ts` — Zod schema, fail-fast via `HTTPException` on parse failure.

Includes: Supabase, Postgres connection strings, AI keys, Stripe, R2, Redis, QStash, OneSignal, Resend, Courier, Align, Thirdweb, Sentry, encryption key, etc.

**Drift from build-guide sample:** many Schnl/fintech vars not in foundation guide; missing dedicated `DATABASE_URL` name (uses `DATABASE_CONNECTION_STRING`, `SUPABASE_DATABASE_URL`).

Local secrets: `.dev.vars` per wrangler convention (gitignored — not verified in repo).

---

## Deployment (intended vs shipped)

### Intended (`24-technical-architecture-backbone.md`)

- Single Cloudflare Worker deploy: `wrangler deploy`.
- `api.brioela.com` route in `wrangler.jsonc`.
- No self-managed servers.

### Shipped signals

| Signal | Evidence |
|---|---|
| Wrangler config present | `backend/wrangler.jsonc` |
| Wrangler deploy script | `backend/package.json` → `"dep": "npx wrangler deploy"` |
| Node build path | `"build": "bun build src/index.ts --outdir=dist --target=node"` |
| Sentry Node SDK | `instrument.ts` uses `@sentry/node` |
| Fly deploy script (broken) | root `deploy:backend` → missing `backend/fly.toml` |
| Dev script | `bun --watch --preload instrument.ts index.ts` — **no `Bun.serve` or `wrangler dev` in backend src** (G14) |

**Conclusion:** Platform is **straddling** CF Workers shape (wrangler, DO export, workers-types) and Node/Bun hosting (pg pool, sentry/node, axios mobile). Target architecture is CF-only per specs; production path not fully cut over.

---

## Tooling workspace (shipped — platform adjacent)

Root orchestrates guard tools under `tools/`:

- `brioela-name-guard` — file/folder naming enforcement
- `brioela-type-guard` — type policy enforcement
- `brioela-lexicon-guard` — vocabulary enforcement
- `brioela-reading-gate` — doc reading gate for agents
- `brioela-brain-migration-manifest` — Brain SQL bundle (used by 04)

These are **shipped** engineering guardrails referenced in `build-guide/02-coding-standards/13-file-name-enforcement.md`.

---

## What downstream features assume from 01

| Need | Expected from 01 | Shipped? |
|---|---|---|
| Hono router + middleware | yes | partial — Schnl routes, not product routes |
| `API_ROUTES` / patterns | yes | yes — `shared/api` |
| Postgres + Drizzle | yes | yes — fintech schema |
| Supabase auth validation | yes | yes |
| `getDb()` | yes | yes |
| QStash job ingress | yes | yes — banking jobs |
| Redis cache client | yes | yes — Upstash |
| `BRIOELA_BRAIN` binding + export | yes | yes |
| HTTP → Brain `idFromName` | yes | **no** (G6) |
| Brioela product Postgres tables | yes | **no** |
| `/api/*` Brioela routes | yes | **no** — `/v1/*` Schnl paths |
| MiraSession DO | yes (cooking) | **no** (G3) |
| R2 client wiring | yes (media features) | env vars present; client in `core/clients` |
| Mobile fetch + shared types | yes | partial — axios, Schnl URLs |

Features listing **01** as blocked-by: 03, 04 (partial), 21 (shell shipped), 24–54 various.

---

## Hard rules (foundation enforcement)

| Rule | Source | Enforced in production? |
|---|---|---|
| Routes from shared constants only | coding standards 05 | yes in mounted routers |
| No raw URL strings in backend routers | coding standards 05 | yes |
| Zod env at startup | 02-backend-worker-setup | yes |
| Drizzle-only Postgres access | 07-data-layer-drizzle | mostly — `getDb()` path |
| DO classes exported from index | CF requirement | yes — Brain only |
| `new_sqlite_classes` for SQLite DOs | wrangler + 06-do-patterns | yes — Brain |
| No `axios` on mobile | 11-packages | **no** (G12) |
| No `ioredis` | 11-packages | **no** — dep present (G12) |
| Branded `UserId` in context | 02-typescript, 08-shared | **no** (G4) |
| `@brioela/shared` root barrel | 04-shared-package | **no** (G8) |

---

## Conflicts to resolve (explicit)

1. **Hosting:** CF Workers (spec) vs Node/Bun + pg Pool (shipped backend scripts).
2. **Domain:** `brioela.com` / `api.brioela.com` (wrangler, specs) vs `schnl.com` (CORS, mobile URLs, Supabase schema).
3. **Route prefix:** `/api/*` (build guide) vs `/v1/*` (shipped).
4. **Shared layout:** `routes/` + `validator/` (guide) vs `api/` + `validators/` (shipped).
5. **Postgres content:** Brioela product tables (guide) vs banking ledger schema (shipped).

---

## Sources

- `build-guide/03-foundation/00-overview.md`
- `build-guide/03-foundation/01-monorepo-setup.md`
- `build-guide/03-foundation/02-backend-worker-setup.md`
- `build-guide/03-foundation/03-database.md`
- `build-guide/03-foundation/04-shared-package-setup.md`
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/02-coding-standards/00-overview.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`
- `build-guide/02-coding-standards/02-typescript-strictness.md`
- `build-guide/02-coding-standards/04-imports-and-barrel-exports.md`
- `build-guide/02-coding-standards/05-backend-hono-patterns.md`
- `build-guide/02-coding-standards/06-backend-do-agent-patterns.md`
- `build-guide/02-coding-standards/07-data-layer-drizzle.md`
- `build-guide/02-coding-standards/08-shared-package-zod.md`
- `build-guide/02-coding-standards/11-packages.md`
- `build-guide/02-coding-standards/13-file-name-enforcement.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `_features/04-brain-foundation/status.md` (Brain blocked-by + DO wiring gap)
- `_features/21-platform-notifications/status.md` (Worker shell partial credit)
