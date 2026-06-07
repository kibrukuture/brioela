# Foundation — Overview

## What This Folder Covers
Everything that must exist before a single feature is built: monorepo structure, Cloudflare Workers setup with Hono.js routing, Supabase project setup, Upstash (QStash + Workflow + Redis) configuration, environment secrets, wrangler.toml, CI/CD. This is the skeleton everything else attaches to.

## Status
[x] complete — five foundation files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-monorepo-setup.md` | Root `package.json`, root `tsconfig.json`, path alias convention |
| `02-backend-worker-setup.md` | `wrangler.jsonc`, backend tsconfig, `src/index.ts` bootstrap, env schema, CORS, auth + error middleware, response envelope, third-party clients |
| `03-database.md` | Two Drizzle instances, Supabase Postgres schema setup, `brioela` schema name, DO SQLite schema, Drizzle config, RLS baseline |
| `04-shared-package-setup.md` | Folder layout (no `src/`), routes pattern, validator structure, constants, root barrel |
| `05-mobile-setup.md` | `app.json`, tsconfig, folder structure, `_layout.tsx`, QueryProvider, network client (fetch-based), env vars, NativeWind tokens, Tailwind config |

## Specs This Folder Draws From
- `brioela-specs/24-technical-architecture-backbone.md` — the architecture source: CF Workers, Hono.js, DOs, Upstash, Supabase, Gemini, and Cloudflare Realtime / RealtimeKit
- `implementable-specs/cooking-session/00-overview.md` — current cooking-session transport decision: Cloudflare Realtime / RealtimeKit

## Key Decisions From Specs
- Single Hono.js router in one Worker — all routes in one `src/index.ts`, one `wrangler.toml`
- All DO classes exported from `src/index.ts` (required by Cloudflare)
- `[[migrations]]` with `new_sqlite_classes` in wrangler.toml for every DO needing SQLite
- Workers are stateless front doors — they route to the correct user's DO via `idFromName(userId)`
- Supabase: shared cross-user data only (products, community notes, map, businesses). NEVER user private data.
- Upstash Redis: product cache, rate limits, session dedup — TTL-bound, disposable
- Upstash QStash: one-shot fire-and-forget jobs (push notifications, enrichment, webhooks)
- Upstash Workflow: multi-step durable flows with `waitForEvent` (post-session summarization, recall matching)
- Current cooking-session transport is Cloudflare Realtime / RealtimeKit.

## What This Folder Depends On
Nothing. Built first.

## What Depends On This Folder
Everything. All 20+ feature folders depend on the foundation being in place.
