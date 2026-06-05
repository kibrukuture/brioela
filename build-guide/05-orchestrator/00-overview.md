# Orchestrator DO — Overview

## What This Folder Covers
The per-user agent brain. One `BrioelOrchestrator` Durable Object per user, forever. This is the critical path — every other feature depends on it. It holds the user's private SQLite database via Drizzle ORM, the complete memory system (user_memory, user_personality, skills, constraints, scan history, recipes, sessions), the tool protocol (every AI-callable tool), the alarm system for ambient intelligence, and the Curator for background maintenance.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/09-per-user-agent-orchestrator.md` — the full orchestrator spec: DO architecture, memory system, skills, tools, context injection, sub-agent delegation, keepAlive pattern
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains, what gets stored and why
- `brioela-specs/24-technical-architecture-backbone.md` — context compression, skill selection, DO cold wake keepAlive
- `brioela-specs/34-universal-visual-intake.md` — visual intake pipeline, memory vs skills distinction
- `implementable-specs/00-overview.md` through `implementable-specs/18-vectorize.md` — full SQLite schema
- `implementable-specs/brioela-tools/` — all 18 AI-callable tools
- `implementable-specs/15-curator.md` — Curator maintenance pass
- `implementable-specs/16-agent-identity.md` — who Brioela is
- `implementable-specs/17-session-lifecycle.md` — session open to close

## Key Decisions From Specs
- `BrioelOrchestrator extends Agent` (Cloudflare Agent SDK) — not raw DurableObject
- `db = drizzle(this.ctx.storage, { schema })` — Drizzle over DO storage; requires `new_sqlite_classes` in wrangler.toml
- Memory write path: always through `memory_update` tool — never direct SQLite writes from AI
- Memory namespace: dot-separated, max 3 levels, lowercase, Zod-enforced at tool boundary, hard cap 40 namespaces
- Skills: index-then-load pattern — AI reads compact index in system prompt, calls `skill_view(name)` on demand
- Alarms: DO self-scheduling via `this.ctx.storage.setAlarm()` — no external cron needed for any per-user ambient feature
- keepAlive heartbeat: alarm every 20s during long-running streams to prevent DO eviction
- Sub-agents: `${userId}-rag`, `${userId}-db`, `${userId}-enrich` — stateless scratch, write facts back to Orchestrator
- Context compression: dual-layer (50% proactive, 85% safety net), sacred block never compressed, fact extraction before compression

## What This Folder Depends On
- `03-foundation` — CF Workers, wrangler.toml
- `04-auth-and-onboarding` — userId to address the DO

## What Depends On This Folder
EVERYTHING. Scanner, cooking session, Ground, Bela, recall alerts, illness detective, meal plan, wearables — all read from and write to the Orchestrator DO.
