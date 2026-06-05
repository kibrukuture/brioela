# Memory Engine — Overview

## What This Folder Covers
NOTE: This folder covers the Orchestrator DO's data layer — the SQLite schema, all table definitions, the Curator maintenance pass, Vectorize semantic search integration, and the visual intake pipeline. This is the data side of the Orchestrator; the agent behavior and tool protocol lives in `05-orchestrator/`.

Covers: all implementable-specs root-level files (01-memory-event through 18-vectorize), the full SQL schema for every table in the Orchestrator DO SQLite, the Curator logic, and the universal visual intake classification pipeline.

## Status
[ ] not started

## Specs This Folder Draws From
- `implementable-specs/01-memory-event.md` through `implementable-specs/12-schema-version.md` — all SQLite table schemas
- `implementable-specs/15-curator.md` — Curator maintenance pass
- `implementable-specs/18-vectorize.md` — Cloudflare Vectorize for skill deduplication
- `brioela-specs/08-personal-food-memory-engine.md` — memory domains, what gets stored
- `brioela-specs/34-universal-visual-intake.md` — visual classification pipeline, memory vs skills distinction, Memory Curator decision matrix

## Key Decisions From Specs
- `memory_event` table: append-only event log — rows never updated or deleted
- `user_memory` table: AI-written facts via `memory_update` tool only — never direct writes
- `user_personality` table: AI-decided trait names — developer never predefines what traits exist
- `skills` table: index-then-load — `description` always in index (~3 tokens), `content` loaded on demand
- Curator fires via DO alarm (not cron): 7-day interval, 2-hour idle check before running
- Grace period: entries within 14 days of `last_write` never touched by Curator
- Visual intake: single Gemini vision call (not Live) — structured JSON output, <2s latency
- Raw images never stored — classification and derived facts only
- Vectorize: skill deduplication on create (background write-path check, never hot read path)

## What This Folder Depends On
- `05-orchestrator` — this IS part of the Orchestrator; data layer for the agent

## What Depends On This Folder
Every feature reads from or writes to this schema.
