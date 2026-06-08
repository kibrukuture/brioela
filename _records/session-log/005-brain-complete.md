# Session 005 — Brain Build Guide Complete

## Date
2026-06-06

## Completed This Session

Full read pass across ALL markdown files in the codebase before writing:
- All brioela-specs/ (41 files)
- All implementable-specs/ root (18 files)
- All implementable-specs/brioela-tools/ (17 files)
- All implementable-specs/cooking-session/ (11 files + proactive-speech-engine/)
- All implementable-specs/bela/ (15 files)
- All build-guide/ detail files (01-design-system through 04-auth-and-onboarding)
- All _records/ files

Written — `build-guide/05-brain/`:
- `00-overview.md` — updated to [x] complete, all six files listed
- `01-do-class-and-setup.md` — BrioelaBrain class, wrangler.jsonc, WAL, keepAlive, Env type
- `02-tool-protocol.md` — all 17 tools, definition pattern, TOOL_PERMISSIONS, /internal/tool-call endpoint, namespace rules
- `03-session-lifecycle.md` — session open, system prompt order, compression (thresholds + CompressorAgent), watchdog alarm
- `04-sub-agents.md` — ephemeral DO pattern, CuratorAgent passes, PatternDetectionAgent, HTTP forwarding full flow
- `05-alarm-system.md` — alarm dispatch, all types, keepAlive, first-boot initialization
- `06-agent-identity.md` — SOUL document, 800 token cap, system prompt block order

Written — `_records/connections/01-brain-connections.md`

## Inventory Status Changes

Mark these as [x] in inventory.md:
- `brioela-specs/09-per-user-brain.md` → [x]
- `implementable-specs/15-curator.md` → [x]
- `implementable-specs/16-agent-identity.md` → [x]
- `implementable-specs/17-session-lifecycle.md` → [x]
- `implementable-specs/brioela-tools/` all 17 files → [x] (tool protocol fully documented)

Mark as [~] partial (feeds both brain and memory-engine):
- `brioela-specs/08-personal-food-memory-engine.md` → [~]
- `implementable-specs/00-overview.md` → [~]
- `implementable-specs/01-memory-event.md` through `12-schema-version.md` → [~] (schemas go in 06-memory-engine)

## In Progress
Nothing half-done.

## What Is Next

`06-memory-engine/` — files to write:
- `01-sqlite-schema.md` — all 12 table schemas (CREATE TABLE SQL + Drizzle schema for each)
- `02-curator-passes.md` — CuratorAgent three passes in full detail (references 05-brain/04-sub-agents.md for the DO pattern — only documents the pass logic here)
- `03-vectorize.md` — Cloudflare Vectorize setup, per-user namespace sharding, hybrid FTS5+Vectorize search
- `04-visual-intake.md` — universal visual intake pipeline (spec 34): Gemini vision call, structured output, memory vs skills decision matrix

Source specs to read before writing 06-memory-engine:
- `implementable-specs/01-memory-event.md` through `12-schema-version.md` — all 12 table specs
- `implementable-specs/18-vectorize.md` — Vectorize integration
- `brioela-specs/34-universal-visual-intake.md` — visual intake pipeline
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains

## Blockers
None.
