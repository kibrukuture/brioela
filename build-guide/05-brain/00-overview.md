# Brain DO — Overview

## What This Folder Covers
The per-user agent brain. One `BrioelaBrain` Durable Object per user, forever. This is the critical path — every other feature depends on it. It holds the user's private SQLite database via Drizzle ORM, the complete memory system (user_memory, user_personality, skills, constraints, scan history, recipes, sessions), the tool protocol (every AI-callable tool), the alarm system for ambient intelligence, and the Curator for background maintenance.

## Status
[x] complete — seven files written; `07` hardens the older manual runtime patterns against current Cloudflare Agents SDK capabilities

## Files In This Folder

| File | Contents |
|---|---|
| `01-do-class-and-setup.md` | BrioelaBrain class, wrangler.jsonc entries, SQLite init, WAL mode, Drizzle wiring, current Agents SDK runtime primitives |
| `02-tool-protocol.md` | All 17 AI-callable tools, tool definition pattern, tool registration, Zod validation at boundary, TOOL_PERMISSIONS, /internal/tool-call forwarding endpoint |
| `03-session-lifecycle.md` | Session open, system prompt construction (SOUL + order), compression triggers, CompressorAgent, abandoned session detection, watchdog alarm |
| `04-sub-agents.md` | Ephemeral DO pattern, CuratorAgent, PatternDetectionAgent, HTTP tool forwarding protocol, caller-based authorization |
| `05-alarm-system.md` | scheduled_alarms product ledger, Agents SDK schedule wake/callback model, ambient intelligence loop, first-boot initialization |
| `06-agent-identity.md` | SOUL document, 800 token cap, system prompt block order, prefix cache contract, update rules |
| `07-agent-framework-hardening.md` | Brioela-first update: Cloudflare Agents SDK runtime primitives, AI SDK tool layer, replacing custom plumbing without making Brioela chat-first |

## Specs This Folder Draws From
- `brioela-specs/09-per-user-brain.md` — full brain spec: DO architecture, memory system, skills, tools, context injection, sub-agent delegation, keepAlive pattern
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains, what gets stored and why
- `brioela-specs/24-technical-architecture-backbone.md` — context compression, skill selection, DO cold wake keepAlive
- `brioela-specs/34-universal-visual-intake.md` — visual intake pipeline, memory vs skills distinction
- `implementable-specs/00-overview.md` — stack overview, WAL mode, prefix cache contract, writers by table
- `implementable-specs/15-curator.md` — CuratorAgent + PatternDetectionAgent: three passes, tool forwarding, TOOL_PERMISSIONS, ephemeral DO pattern
- `implementable-specs/16-agent-identity.md` — SOUL document, system prompt order, 800 token cap
- `implementable-specs/17-session-lifecycle.md` — compression triggers, CompressorAgent, abandoned detection, watchdog alarm
- Current Cloudflare Agents SDK docs — sub-agents, agent tools, schedules, queues, fibers, workflows, sessions, skills

## Key Decisions From Specs
- `BrioelaBrain extends Agent` (Cloudflare Agent SDK) — not raw DurableObject
- `db = drizzle(this.ctx.storage, { schema })` — Drizzle over DO storage; requires `new_sqlite_classes` in wrangler.jsonc
- Memory write path: always through `write_user_memory` tool — never direct SQLite writes from AI
- Memory namespace: dot-separated, max 3 levels, lowercase, Zod-enforced at tool boundary, hard cap 40 namespaces
- Skills: index-then-load pattern — AI reads compact index in system prompt, calls `view_user_skill(name)` on demand
- Alarms: `scheduled_alarms` stores product meaning/outcomes; Agents SDK `schedule()` wakes/calls execution when possible
- keepAlive: use `keepAliveWhile()` / fibers for long provider interactions; do not use manual heartbeat alarms as default
- Sub-agents: ephemeral DOs keyed by `curator_${userId}_${runId}`, `pattern_${userId}_${runId}` — no SQLite, all writes forwarded
- Context compression: chat sessions at 40 turns/60k tokens, cooking at 80 turns/100k tokens — CompressorAgent produces four-field summary
- Abandoned detection: watchdog alarm set at session open, marks sessions abandoned if still active when fired
- SOUL: 800 token cap, universal constant, block order is fixed for Anthropic prefix caching
- Brioela is ambient, not chat-first; Cloudflare Agents SDK owns durable runtime, Vercel AI SDK owns model/tool calls, and Brioela owns food memory/safety/surfacing policy.
- Prefer current Agents SDK primitives (`subAgent`, `agentTool`, `schedule`, `queue`, `runFiber`, `keepAliveWhile`, Workflows) over custom runtime plumbing where they express the same behavior.

## What This Folder Depends On
- `03-foundation` — CF Workers, wrangler.jsonc, Drizzle setup
- `04-auth-and-onboarding` — userId to address the DO

## What Depends On This Folder
EVERYTHING. Scanner, cooking session, Ground, Bela, recall alerts, illness detective, meal plan, wearables — all read from and write to the Brain DO. Nothing builds before this.
