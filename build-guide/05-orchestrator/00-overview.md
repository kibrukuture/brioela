# Orchestrator DO — Overview

## What This Folder Covers
The per-user agent brain. One `BrioelOrchestrator` Durable Object per user, forever. This is the critical path — every other feature depends on it. It holds the user's private SQLite database via Drizzle ORM, the complete memory system (user_memory, user_personality, skills, constraints, scan history, recipes, sessions), the tool protocol (every AI-callable tool), the alarm system for ambient intelligence, and the Curator for background maintenance.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-do-class-and-setup.md` | BrioelOrchestrator class, wrangler.jsonc entries, SQLite init, WAL mode, Drizzle wiring, keepAlive pattern, fetch() + alarm() entry points |
| `02-tool-protocol.md` | All 17 AI-callable tools, tool definition pattern, tool registration, Zod validation at boundary, TOOL_PERMISSIONS, /internal/tool-call forwarding endpoint |
| `03-session-lifecycle.md` | Session open, system prompt construction (SOUL + order), compression triggers, CompressorAgent, abandoned session detection, watchdog alarm |
| `04-sub-agents.md` | Ephemeral DO pattern, CuratorAgent, PatternDetectionAgent, HTTP tool forwarding protocol, caller-based authorization |
| `05-alarm-system.md` | Alarm dispatch, all alarm types, scheduled_alarms table as queue, keepAlive heartbeat, ambient intelligence loop, first-boot initialization |
| `06-agent-identity.md` | SOUL document, 800 token cap, system prompt block order, prefix cache contract, update rules |

## Specs This Folder Draws From
- `brioela-specs/09-per-user-agent-orchestrator.md` — full orchestrator spec: DO architecture, memory system, skills, tools, context injection, sub-agent delegation, keepAlive pattern
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains, what gets stored and why
- `brioela-specs/24-technical-architecture-backbone.md` — context compression, skill selection, DO cold wake keepAlive
- `brioela-specs/34-universal-visual-intake.md` — visual intake pipeline, memory vs skills distinction
- `implementable-specs/00-overview.md` — stack overview, WAL mode, prefix cache contract, writers by table
- `implementable-specs/15-curator.md` — CuratorAgent + PatternDetectionAgent: three passes, tool forwarding, TOOL_PERMISSIONS, ephemeral DO pattern
- `implementable-specs/16-agent-identity.md` — SOUL document, system prompt order, 800 token cap
- `implementable-specs/17-session-lifecycle.md` — compression triggers, CompressorAgent, abandoned detection, watchdog alarm

## Key Decisions From Specs
- `BrioelOrchestrator extends Agent` (Cloudflare Agent SDK) — not raw DurableObject
- `db = drizzle(this.ctx.storage, { schema })` — Drizzle over DO storage; requires `new_sqlite_classes` in wrangler.jsonc
- Memory write path: always through `write_user_memory` tool — never direct SQLite writes from AI
- Memory namespace: dot-separated, max 3 levels, lowercase, Zod-enforced at tool boundary, hard cap 40 namespaces
- Skills: index-then-load pattern — AI reads compact index in system prompt, calls `view_user_skill(name)` on demand
- Alarms: DO self-scheduling via `this.ctx.storage.setAlarm()` — no external cron for any per-user ambient feature
- keepAlive heartbeat: alarm every 20s during long-running streams to prevent DO eviction
- Sub-agents: ephemeral DOs keyed by `curator_${userId}_${runId}`, `pattern_${userId}_${runId}` — no SQLite, all writes forwarded
- Context compression: chat sessions at 40 turns/60k tokens, cooking at 80 turns/100k tokens — CompressorAgent produces four-field summary
- Abandoned detection: watchdog alarm set at session open, marks sessions abandoned if still active when fired
- SOUL: 800 token cap, universal constant, block order is fixed for Anthropic prefix caching

## What This Folder Depends On
- `03-foundation` — CF Workers, wrangler.jsonc, Drizzle setup
- `04-auth-and-onboarding` — userId to address the DO

## What Depends On This Folder
EVERYTHING. Scanner, cooking session, Ground, Bela, recall alerts, illness detective, meal plan, wearables — all read from and write to the Orchestrator DO. Nothing builds before this.
