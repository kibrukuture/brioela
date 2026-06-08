# Implementable Specs — BrioelaBrain SQLite Brain

These documents are NOT feature specs. They are implementation decisions.

Each file covers one SQLite table (or virtual table group) in the BrioelaBrain Durable Object. It contains:
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
2. [user_memory](./02-user-memory.md) — structured declarative facts (40 namespace cap)
3. [user_personality](./03-user-personality.md) — synthesized personality traits with strength decay
4. [skills](./04-skills.md) — reusable procedural instruction sets
5. [skill_versions](./05-skill-versions.md) — full content history before every update_user_skill
6. [constraints](./06-constraints.md) — allergies, intolerances, dislikes, dietary identity, boycotts
7. [sessions](./07-sessions.md) — session metadata, token costs, compression chains
8. [session_turns](./08-session-turns.md) — conversation turns per session (+ session_turns_fts + session_turns_fts_trigram)
9. [recipes](./09-recipes.md) — user personal recipe collection
10. [scheduled_alarms](./10-scheduled-alarms.md) — pending alarm queue
11. [agent_state](./11-agent-state.md) — key-value store for agent metadata
12. [schema_version](./12-schema-version.md) — migration tracking

**Note on table 8**: `session_turns_fts` and `session_turns_fts_trigram` are FTS5 virtual tables covered in the same file as `session_turns`. They are virtual — they sit on top of `session_turns`, provide a search interface, and do not store truth. The real data lives in `session_turns` only.

## Stack

- Runtime: Cloudflare Durable Objects (BrioelaBrain + MiraSession)
- ORM: Drizzle ORM with `drizzle-orm/durable-sqlite` adapter
- SQLite: per-user, physically isolated, accessed via `this.ctx.storage`
- FTS: SQLite FTS5 module — keyword search inside DO, zero external latency
- Vector: Cloudflare Vectorize — semantic search, per-user namespace isolation (see Vector Layer below)
- Migrations: `drizzle-orm/durable-sqlite/migrator`

## WAL Mode

Every BrioelaBrain DO must run this pragma at initialization before any reads or writes:

```sql
PRAGMA journal_mode=WAL;
```

WAL (Write-Ahead Logging) allows concurrent reads during a write. Without it, any write locks the entire database and concurrent reads block. Set once at DO startup — it persists for the lifetime of that DO instance.

## Vector Layer

SQLite inside Cloudflare DO does not support `sqlite-vec` or any vector extension. Vector search requires Cloudflare Vectorize — an external service within the Cloudflare network. Worker-to-Vectorize latency is 5–20ms (Cloudflare-to-Cloudflare), not comparable to an external API call.

### Per-User Isolation — Namespace Sharding

Every user's vectors must be isolated. One million users cannot share a namespace.

Architecture:
- Multiple Vectorize indexes, named `brioela-{domain}-{shard}` (e.g. `brioela-memory-00` through `brioela-memory-19`)
- User maps to a shard: `shard = hash(userId) % SHARD_COUNT`
- Within each shard index, `namespace = userId`
- Every query specifies `namespace: userId` — Cloudflare applies this filter BEFORE the vector search

Cloudflare Vectorize limits (Workers Paid): 50,000 namespaces per index, 50,000 indexes per account, 10,000,000 vectors per index. Sharding across 20 indexes handles 1,000,000 users with room to grow.

### One Vector Domain

**`brioela-sessions-{shard}`** — embeddings of `sessions.outcome_summary`. Used for meaning-based session recall: "when did something like this happen before." A user with years of sessions has thousands of outcome_summaries — they cannot all be loaded into context. FTS5 handles keyword-based session search; Vectorize handles intent-based recall over unbounded history. This is the only place volume grows unbounded and meaning-based recall cannot be solved by loading everything into context.

**Why not `skills`**: The full skill index (name + description for every active skill) is already injected into every prompt. The agent sees all existing skills before calling `create_user_skill` and can judge semantic overlap itself. Volume is also tiny — a user has at most tens of skills, never millions. No external vector service needed.

**Why not `user_memory`**: Already organized by namespace. `load_session_context()` loads relevant namespaces directly — no semantic search needed. Total volume is bounded (40 namespaces) and loaded wholesale into context.

### Hybrid Search

FTS5 and Vectorize are complementary, not competing:
- FTS5 runs inside the DO — zero latency, exact keyword matching, inverted index
- Vectorize runs externally — 5–20ms, semantic meaning matching, nearest-neighbor search

For any recall query, run both, merge results, deduplicate by entry_id, rank by combined score.

## Prefix Cache Contract — System Prompt Ordering

Anthropic's prefix caching reduces token cost by caching the static portion of the system prompt across turns. Every turn in a session re-sends the full system prompt — without prefix caching, the cost is linear in turns. With prefix caching, the static prefix is computed once and cached; only the conversation turns cost tokens on subsequent calls.

**The contract**: static context must always appear BEFORE conversation turns in the system prompt. If any dynamic content appears before the static block, the cache prefix is invalidated on every turn and caching is lost entirely.

Static context (order matters — most stable to least stable):
1. Agent identity (from `16-agent-identity.md` — never changes per session)
2. Active constraints injected wholesale (changes only when Brain maintenance runs — stable per session)
3. Skills index — name + description of all active skills (stable per session)
4. User personality traits (stable per session)
5. User memory for relevant namespaces (stable per session — loaded once at session start)
6. Session context from `load_session_context` — last session summary, pending alarms, memory namespaces (stable per session — loaded once)

Conversation turns come after all of the above. Never interleave dynamic content (tool results, turn-by-turn updates) into the static prefix block.

**Why this matters**: A Brioela chat session can run 40 turns before compression. Without prefix caching, the static system prompt (which can be 4–8k tokens) is billed at full cost 40 times. With prefix caching, it is billed once. The implementation choice of loading everything at session start (not on demand mid-session) is what makes this possible — `load_session_context` is called once, the result is injected into the system prompt, and the prefix never changes for the lifetime of the session.

## Core Design Principle

Every table exists because data must persist and be queried. If something can be computed at runtime or derived from another table, it does not get its own table. Each table has one clear owner — one thing that writes to it. Shared write ownership is a bug waiting to happen.

## Writers by Table

| Table | Writer |
|---|---|
| memory_event | Agent (any session type) |
| user_memory | Agent (fact extraction from events) |
| user_personality | Brain maintenance only |
| skills | Agent (create/update/archive) + Brain maintenance (update/archive) |
| skill_versions | update_user_skill execution path only |
| constraints | Agent only (propose/confirm/reject) |
| sessions | BrioelaBrain + MiraSession (each owns its own row) |
| session_turns | Agent (during active session) |
| recipes | Agent |
| scheduled_alarms | Agent + DO alarm handler |
| agent_state | Agent |
| schema_version | Migrator only |
