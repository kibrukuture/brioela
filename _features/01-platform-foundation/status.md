# Status

open

Platform skeleton exists and config/adapter layer is now Brioela-aligned. Schnl/fintech legacy code (routes, handlers, jobs, schemas) **intentionally stays in the codebase** — it will be removed incrementally as new Brioela features replace each area. Do not bulk-delete legacy code ahead of replacement. New Brioela product features (routes, Postgres tables, mobile screens) are not added all at once — they ship one feature at a time as the numbered feature list progresses.

# Shipped in repo (partial)

## Monorepo
- [x] Bun workspaces: `backend`, `shared`, `mobile`, `tools/*`
- [x] Root guard scripts (name, type, lexicon, reading-gate)
- [x] Root `tsconfig.json` strict baseline

## Backend shell
- [x] Hono app split: `create.app.handler` + mount helpers
- [x] `src/index.ts` exports `BrioelaBrain` + default `app`
- [x] CORS, error handler, auth middleware with skip routes
- [x] Routers mounted via `API_ROUTES` from shared
- [x] Zod env validation (`core/config/env.ts`)
- [x] `getDb()` Postgres Drizzle client — `drizzle-orm/postgres-js` + `postgres()`, transaction pooler, `prepare: false`
- [x] Supabase admin client — `createClient<BrioelaNonTypedDb, 'brioela'>`, schema `brioela`
- [x] QStash queue ingress + signature verify
- [x] Upstash Redis client
- [x] Response helpers with meta/requestId
- [x] `wrangler.jsonc` with `BRIOELA_BRAIN` + `api.brioela.com` route

## Shared
- [x] `shared/api` route constants + `API_ROUTES` barrel
- [x] `shared/validators` Zod modules
- [x] `shared/drizzle` Postgres with `pgSchema('brioela')`
- [x] Drizzle kit scripts (`db:gen`, `db:mig`, `db:mig:run`)
- [x] `shared/zod` v4 re-export

## DO platform
- [x] `BrioelaBrain` exported from Worker entry
- [x] Shared `applyDurableSqliteMigration` adapter
- [x] `worker-configuration.d.ts` from wrangler types

## Mobile
- [x] Expo workspace with network layer + auth store
- [x] Imports from `@brioela/shared/*`

## Tooling
- [x] Name/type/lexicon guards + reading gate
- [x] Brain migration manifest tool (consumed by 04)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | Backend package name `@brioela/api` vs guide `@brioela/backend` | `backend/package.json` `"name"` |
| G2 | Dual runtime: Node/Bun build (`--target=node`, `@sentry/node`) vs CF Workers spec | `backend/package.json` scripts; `instrument.ts`; `24-technical-architecture-backbone.md` |
| G3 | No `MiraSession` DO export or wrangler binding | `wrangler.jsonc` only `BrioelaBrain`; `index.ts` export list |
| G4 | No branded `UserId` on Hono context — raw `user.id` string | `app/context.type.ts`; guide `05-backend-hono-patterns.md` |
| G5 | Response envelope includes `meta.requestId` — guide shows `{ data }` only | `lib/response.ts` vs `02-backend-worker-setup.md` |
| G6 | No API route calls `BRIOELA_BRAIN.idFromName(userId)` | `rg BRIOELA_BRAIN backend/src/api` — zero; `04-brain-foundation/status.md` G17 |
| G7 | Shared folders `api/` + `validators/` vs guide `routes/` + `validator/` | `shared/` tree vs `04-shared-package-setup.md` |
| G8 | No root `shared/index.ts` barrel — subpath imports only | `glob shared/index.ts` — missing; guide requires barrel |
| G12 | Banned package present: `axios` (mobile) | `mobile/network/core/client.ts`; `11-packages.md` bans |
| G13 | No `@upstash/workflow` dependency despite architecture spec | `backend/package.json`; `24-technical-architecture-backbone.md` |
| G25 | Email footer still says `Schnl Team` — not `Brioela` | `backend/src/core/email/templates/wrapper.template.tsx:92` |
| G14 | `dev` script runs Bun on `index.ts` with no `Bun.serve` / no `wrangler dev` | `backend/package.json`; `rg Bun.serve backend/src` — zero |
| G15 | Root `deploy:backend` references missing `backend/fly.toml` | `package.json` `deploy:backend`; `glob **/fly.toml` — zero |
| G16 | Root tsconfig missing `@brioela/shared` path aliases | `tsconfig.json` vs `02-typescript-strictness.md` |
| G17 | No Brioela product API routers (scan, recipes, ground, map, bela, recall) | `mount.routes.handler.ts` vs `01-monorepo-and-folder-structure.md` |
| G18 | Postgres schema is banking/fintech tables, not Brioela product tables | `shared/drizzle/schema/index.ts` vs `03-database.md` product list |
| G19 | Route prefix `/v1/*` not `/api/*` from build guide | `shared/api/users.routes.ts` `base: "/v1/users"` |
| G20 | Auth requires `userId` query param — not in foundation guide middleware sample | `auth.ts` lines 61–67 |
| G21 | `exactOptionalPropertyTypes` not enabled at root | `tsconfig.json` vs `02-typescript-strictness.md` |
| G22 | Mobile structure diverges from foundation guide (Schnl screens, no Brioela tabs) | `mobile/app/` vs `05-mobile-setup.md` |
| G23 | R2/S3 env wired but no foundation-level R2 client doc in build guide 03 | `env.ts` R2_* vars; client elsewhere in `core/clients` |
| G24 | `@hono/zod-validator` not in backend deps — guide lists it | `backend/package.json` vs `11-packages.md` |

# Blocked by

None.

# Blocks

- 02-platform-design-system (mobile shell alignment)
- 03-platform-auth-onboarding (auth routes + permission UX on top of middleware)
- 04-brain-foundation (DO binding shipped; HTTP wiring still open — G6)
- 21-platform-notifications (partial — credits Worker shell)
- 24-scanner through 54-tonight (product APIs assume Hono router, shared routes, Postgres, QStash, R2)
- All features listing `01-platform-foundation` in their `status.md` blocked-by sections

# Sources

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
- `_features/04-brain-foundation/spec.md`
- `_features/04-brain-foundation/build.md`
- `_features/04-brain-foundation/status.md`
- `_features/21-platform-notifications/status.md`
- `_features/03-platform-auth-onboarding/status.md`
- `_features/README.md`

# Draft count

**29** files in `draft/` — root/backend/shared/mobile entrypoints, wrangler, env, middleware, database clients, SQLite adapter, route index, URLs.
