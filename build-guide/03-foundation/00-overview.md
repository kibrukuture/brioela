# Foundation — Overview

## What This Folder Covers
Everything that must exist before a single feature is built: monorepo structure, Cloudflare Workers setup with Hono.js routing, Supabase project setup, Upstash (QStash + Workflow + Redis) configuration, environment secrets, wrangler.toml, CI/CD. This is the skeleton everything else attaches to.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/24-technical-architecture-backbone.md` — the complete architecture: CF Workers, Hono.js, DOs, Upstash, Supabase, LiveKit, Gemini, Railway/Fly.io for LiveKit agent worker

## Key Decisions From Specs
- Single Hono.js router in one Worker — all routes in one `src/index.ts`, one `wrangler.toml`
- All DO classes exported from `src/index.ts` (required by Cloudflare)
- `[[migrations]]` with `new_sqlite_classes` in wrangler.toml for every DO needing SQLite
- Workers are stateless front doors — they route to the correct user's DO via `idFromName(userId)`
- Supabase: shared cross-user data only (products, community notes, map, businesses). NEVER user private data.
- Upstash Redis: product cache, rate limits, session dedup — TTL-bound, disposable
- Upstash QStash: one-shot fire-and-forget jobs (push notifications, enrichment, webhooks)
- Upstash Workflow: multi-step durable flows with `waitForEvent` (post-session summarization, recall matching)
- LiveKit Agent Worker: Node.js on Railway or Fly.io — cannot run in CF Worker. Separate deploy.

## What This Folder Depends On
Nothing. Built first.

## What Depends On This Folder
Everything. All 20+ feature folders depend on the foundation being in place.
