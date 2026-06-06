# Memory Engine — Overview

## What This Folder Covers

The Orchestrator DO's data layer: all 12 SQLite table definitions, the Curator maintenance passes, Cloudflare Vectorize semantic search integration, and the universal visual intake pipeline. This is the data side of the Orchestrator. The agent behavior, tool protocol, and session lifecycle live in `05-orchestrator/`.

## Status
[x] complete — four files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-sqlite-schema.md` | All 12 tables: CREATE TABLE SQL, Drizzle schema, column decisions, indexes, write rules, read rules. Full DO startup sequence. |
| `02-curator-passes.md` | CuratorAgent three passes: skill maintenance (archive stale user skills), trait decay (update strength, archive low-strength traits), trait inference (create new personality traits from user_memory patterns). PatternDetectionAgent behavioral pattern pass. |
| `03-vectorize.md` | Cohere embed-multilingual-v2.0, 20-shard index structure, shard assignment, wrangler.jsonc bindings, fire-and-forget embedding at session close, semantic query path, failure handling, account setup checklist. |
| `04-visual-intake.md` | Single Gemini vision call, structured JSON output, memory vs skills decision, memory routing by category, medication photo chain, stool Bristol Scale classification, discard decision rules. |

## Specs This Folder Draws From

- `implementable-specs/01-memory-event.md` — memory_event table
- `implementable-specs/02-user-memory.md` — user_memory table, namespace rules, merge logic
- `implementable-specs/03-user-personality.md` — user_personality table, strength decay rules
- `implementable-specs/04-skills.md` — skills table, index-then-load pattern
- `implementable-specs/05-skill-versions.md` — skill_versions table
- `implementable-specs/06-constraints.md` — constraints table, confirmation workflow
- `implementable-specs/07-sessions.md` — sessions table
- `implementable-specs/08-session-turns.md` — session_turns table + FTS5 virtual tables
- `implementable-specs/09-recipes.md` — recipes table, session-end decision tree
- `implementable-specs/10-scheduled-alarms.md` — scheduled_alarms table, Path A vs Path B distinction
- `implementable-specs/11-agent-state.md` — agent_state table, all known keys
- `implementable-specs/12-schema-version.md` — __drizzle_migrations, DO startup sequence
- `implementable-specs/15-curator.md` — CuratorAgent + PatternDetectionAgent passes, TOOL_PERMISSIONS
- `implementable-specs/18-vectorize.md` — embedding model, shard structure, query implementation
- `brioela-specs/34-universal-visual-intake.md` — visual intake pipeline, memory vs skills, Ground boundary
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains, what gets stored

## Key Decisions From Specs

- All 12 tables live in one SQLite file per user — no sharing across users, no Supabase
- `user_memory` id = `"${namespace}:${key}"` — human-readable composite, not UUID
- Namespace cap: 40 distinct namespaces max, enforced in `write_user_memory` tool before insert
- `user_memory` facts are never deleted — only deactivated (`active = 0`)
- `user_personality` traits written by Curator only — not by agent mid-session
- `constraints` table never touched by Curator — too safety-critical
- `hard_allergy` requires `confirmation_source = 'user_explicit'` — behavioral threshold alone not enough
- Curator only modifies `source = 'user'` skills — never system skills
- Mass-archive guard: Curator archives max 5 skills per pass, flags anomaly if more needed
- Vectorize: Cohere `embed-multilingual-v2.0` (768 dims), 20 shards × 50k namespaces = 1M users
- Embedding created fire-and-forget at session close via `ctx.waitUntil()`
- Visual intake: single Gemini vision call, structured JSON output, discard threshold intentionally high
- Personal visual intake never bleeds into Ground (spec 35) — two separate UI flows, two separate code paths

## What This Folder Depends On

- `05-orchestrator` — this IS the Orchestrator's data layer. The DO class, tool protocol, session lifecycle, and sub-agent pattern all live there.
- `03-foundation` — Drizzle setup, wrangler.jsonc

## What Depends On This Folder

Everything. Every feature reads from or writes to this schema. Scanner reads constraints. Cooking session writes session_turns. Ground writes memory_event. Recall alerts read memory_event. Illness detective reads memory_event. Recipe ingestion writes recipes. All features read user_memory and user_personality from session context.
