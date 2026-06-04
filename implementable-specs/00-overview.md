# Implementable Specs — BrioelOrchestrator SQLite Brain

These documents are NOT feature specs. They are implementation decisions.

Each file covers one SQLite table in the BrioelOrchestrator Durable Object. It contains:
- The exact CREATE TABLE SQL
- The Drizzle schema
- Every column with its type, constraints, and reason for existing
- Why this table exists as its own table (not merged into another)
- Write rules — who writes to it, when, how
- Read rules — who reads from it, when, how
- Indexes and why
- What is explicitly NOT stored here and where it goes instead

## Tables

1. [memory_event](./01-memory-event.md) — raw append-only event log
2. [user_memory](./02-user-memory.md) — structured declarative facts
3. [user_personality](./03-user-personality.md) — synthesized personality traits
4. [skills](./04-skills.md) — reusable procedural instruction sets
5. [constraints](./05-constraints.md) — allergies, dislikes, dietary identity
6. [sessions](./06-sessions.md) — session metadata
7. [session_turns](./07-session-turns.md) — conversation turns per session
8. [session_turns_fts](./08-session-turns-fts.md) — FTS5 full-text search virtual table
9. [recipes](./09-recipes.md) — user personal recipe collection
10. [scheduled_alarms](./10-scheduled-alarms.md) — pending alarm queue
11. [agent_state](./11-agent-state.md) — key-value store for agent metadata
12. [schema_version](./12-schema-version.md) — migration tracking

## Stack

- Runtime: Cloudflare Durable Objects (BrioelOrchestrator)
- ORM: Drizzle ORM with `drizzle-orm/durable-sqlite` adapter
- SQLite: per-user, physically isolated, accessed via `this.ctx.storage`
- FTS: SQLite FTS5 module (built into Cloudflare DO SQLite)
- Migrations: `drizzle-orm/durable-sqlite/migrator`

## Core Design Principle

Every table exists because data must persist and be queried. If something can be computed at runtime or derived from another table, it does not get its own table. Each table has one clear owner — one thing that writes to it. Shared write ownership is a bug waiting to happen.
