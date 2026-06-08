# Table: user_memory

## Why This Table Exists

`user_memory` is the single table for all declarative facts about the user. A declarative fact is something that is currently true about the user — their medication, their dietary restrictions, the places they love, their relationship to food.

This is NOT event history (`memory_event`). This is NOT synthesized personality (`user_personality`). This is NOT procedural instructions (`skills`).

Examples of what lives here:
- "User takes metformin 500mg twice daily" → `health.medications : metformin`
- "User is lactose intolerant" → `diet.restrictions : lactose`
- "User lived in Addis Ababa for 10 years" → `life.places : addis_ababa`
- "User prefers to cook without oil" → `diet.preferences : no_oil`

Facts are derived from events (a scan, a photo, a conversation) by the agent calling `write_user_memory`. They accumulate over time. They get merged — not overwritten — when new evidence arrives. They can be deactivated but never deleted.

## Decision: Why one table for all facts, not one table per domain?

A separate table per domain (health_memory, diet_memory, location_memory) seems organized but creates real problems:
- Adding a new fact domain requires a migration.
- The AI invents namespace names — it cannot be constrained to predefined domains.
- Cross-domain queries (everything about this user for session context) require joining multiple tables.
- The Brain maintenance runs one pass over all facts — one table is one query.

One table with a `namespace` column gives the AI full freedom to invent structure while keeping the database simple and the queries fast.

## Decision: Why namespace:key as the primary key?

Each fact is uniquely identified by what it is about (`namespace`) and what specific item it describes (`key`). `health.medications:metformin` is one fact. There can only be one. If new evidence arrives about metformin, it merges into the existing row — not a new row. The composite primary key enforces this uniqueness physically.

## CREATE TABLE

```sql
CREATE TABLE user_memory (
  id          TEXT PRIMARY KEY,     -- "${namespace}:${key}" — composite, human-readable, unique
  user_id     TEXT NOT NULL,        -- owner — self-describing for export and Data Studio
  namespace   TEXT NOT NULL,        -- dot-separated, AI-chosen, max 3 levels: "health.medications"
  key         TEXT NOT NULL,        -- specific item within namespace: "metformin", "lactose"
  value       TEXT NOT NULL,        -- JSON object — never a bare string
  confidence  REAL NOT NULL DEFAULT 1.0,  -- 0.0 to 1.0 — how certain this fact is
  source      TEXT NOT NULL,        -- 'image' | 'conversation' | 'inferred' | 'cron'
  is_active   INTEGER NOT NULL DEFAULT 1, -- true = active, false = deactivated (soft delete only)
  importance  INTEGER NOT NULL DEFAULT 5,  -- 1–10, LLM-assessed at write time — how much this fact matters
  read_count  INTEGER NOT NULL DEFAULT 0, -- times this entry was injected into a prompt
  write_count INTEGER NOT NULL DEFAULT 0, -- times this entry was written or updated
  last_read   INTEGER,              -- unix timestamp ms of last prompt injection
  last_write  INTEGER,              -- unix timestamp ms of last write
  updated_at  INTEGER NOT NULL      -- unix timestamp ms of last any change
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const userMemory = sqliteTable('user_memory', {
  id:         text('id').primaryKey(),           // "${namespace}:${key}"
  userId:     text('user_id').notNull(),
  namespace:  text('namespace').notNull(),
  key:        text('key').notNull(),
  value:      text('value').notNull(),           // JSON object stringified
  confidence: real('confidence').notNull().default(1.0),
  source:     text('source').notNull(),          // free text — Zod enforces known values at tool boundary
  isActive:   integer('is_active', { mode: 'boolean' }).notNull().default(true),
  importance: integer('importance').notNull().default(5),
  readCount:  integer('read_count').notNull().default(0),
  writeCount: integer('write_count').notNull().default(0),
  lastRead:   integer('last_read'),
  lastWrite:  integer('last_write'),
  updatedAt:  integer('updated_at').notNull(),
})
```

## Column Decisions

**`id` — `"${namespace}:${key}"`, not UUID**
Unlike `memory_event` where rows are unique occurrences, facts are unique by identity. "What is the user's metformin entry?" has exactly one answer. The composite string makes that answer directly addressable — `db.get(userMemory, { id: 'health.medications:metformin' })`. A UUID would require a separate lookup. Human-readable IDs also make Data Studio debugging immediate.

**`user_id` — kept**
Same reason as `memory_event`. Rows must be self-describing outside the DO context.

**`namespace` — AI-chosen, dot-separated, max 3 levels**
The AI decides what namespace a fact belongs to. Developer defines zero valid namespaces. The AI sees the existing namespace list before writing and extends what exists rather than inventing new ones. The hard cap (40 distinct namespaces) is enforced in code, not SQL. Max 3 dot levels (`category.subcategory.detail`) enforced by Zod regex at tool boundary.

**`key` — specific item within the namespace**
The key identifies the specific thing. Under `health.medications`, keys are medication names: `metformin`, `lisinopril`. Under `diet.restrictions`, keys are restriction names: `lactose`, `gluten`. The key is always lowercase with underscores — enforced by Zod regex.

**`value` — JSON object, never bare string**
The AI writes structured observations, not flat strings. `{ "dose": "500mg", "frequency": "2x daily" }` not `"500mg"`. A JSON object can absorb new fields on subsequent writes without losing old ones — the merge logic spreads new keys over existing keys. A bare string cannot merge.

**`confidence` — 0.0 to 1.0**
Inferred facts carry lower confidence than explicitly declared ones. A user saying "I'm allergic to nuts" → `confidence: 1.0`. The agent inferring a dislike from 3 scans where the user always put the product back → `confidence: 0.6`. The Brain maintenance uses this when deciding what to clean up. Low confidence + low read + old last_write = candidate for deactivation.

**`source` — free text, Zod-enforced known values**
Known values: `'image' | 'conversation' | 'inferred' | 'cron'`. New sources can be added without migration. Zod enforces at tool boundary — the AI cannot write an unknown source.

**`is_active` — boolean soft-delete flag, not a lifecycle enum**
Facts are never deleted. A user says "I'm not lactose intolerant anymore" — the fact is deactivated (`isActive = false`), not removed. Deactivated facts are excluded from prompts but preserved in the table. Reason: if the user comes back and says "actually I was wrong, it does affect me" — the history is still there, confidence can be updated, no data is lost.

**`importance` — 1–10, LLM-assessed at write time**
Not the same as `confidence`. `confidence` answers "how certain is this fact true?" `importance` answers "how much does this fact matter for this user's context?" They are orthogonal:
- Medication allergy stated directly → `confidence: 1.0, importance: 9`
- One-time observation that user preferred green tea once → `confidence: 0.9, importance: 3`
- Agent inferred a dislike from 2 scans → `confidence: 0.6, importance: 4`

The LLM self-assesses `importance` at write time using the context it just learned. Scale: 1 = trivial observation, 5 = useful fact worth keeping, 9–10 = safety-critical or identity-defining (allergy, medication, religious restriction). The Brain maintenance uses `importance` alongside `read_count` when choosing pruning candidates — a high-importance, low-read fact is never a candidate for deactivation regardless of age; a low-importance, low-read, old fact is the first to go.

**`read_count` vs `write_count` — two different Brain maintenance signals**
These are not symmetric and the Brain maintenance uses them differently:
- High `read_count`, low `write_count` → core stable memory. A medication entry written once from one photo, read in every health conversation. Never touch this.
- Low `read_count`, low `write_count`, old `last_write` → one-time observation never acted on. Brain maintenance candidate for deactivation.
- High `write_count`, rising `confidence` → actively reinforced fact. Healthy — keep it.
- Recent `last_write` (within 14 days), low `read_count` → new entry, give it time. Brain maintenance grace period — never touch it yet.

**`last_read` and `last_write` — timestamps, not just counts**
The count alone doesn't tell you when. An entry with `read_count: 50` but `last_read` two years ago is very different from one with `read_count: 50` and `last_read` yesterday. The Brain maintenance needs both the frequency and the recency.

## Zod Schema (Tool Boundary Enforcement)

```typescript
import { z } from 'zod'

const MemoryEntrySchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/)
    // allows:  "health", "health.medications", "health.medications.current"
    // rejects: "Health.Medications" (uppercase), "a.b.c.d" (too deep), "health medications" (space)
    .max(48),
  key: z.string()
    .regex(/^[a-z][a-z0-9_-]*$/)
    .max(64),
  value: z.record(z.string(), z.unknown()), // JSON object — AI writes the content, we enforce the shape
  confidence: z.number().min(0).max(1).default(1.0),
  importance: z.number().int().min(1).max(10).default(5),
  source: z.enum(['image', 'conversation', 'inferred', 'cron']),
})
```

## Namespace Auto-Discovery — How the Agent Knows What Exists

Before writing any fact, the agent must know what namespaces already exist so it extends them rather than inventing duplicates. This is how it knows:

**`load_session_context` returns `memory_namespaces`** — a list of all distinct active namespace strings — as part of its standard response at every session start. The agent holds this list in context for the entire session.

```json
"memory_namespaces": ["diet", "diet.preferences", "family", "health", "health.medications", "life.places"]
```

**The agent's decision rule before every `write_user_memory` call:**

```
1. Does an existing namespace cover this fact?
   → "User takes metformin" → "health.medications" exists → write there
   → "User prefers no oil" → "diet.preferences" exists → write there

2. Is there a parent namespace that is close enough?
   → "User's grandmother is named Tigist" → "family" exists → write to "family" with key "grandma"

3. Nothing fits → create a new namespace
   → Check: is the count < 40? (enforced by write_user_memory at write time)
   → Add the new namespace name to the in-context list for this session
   → Subsequent writes this session use the new name consistently
```

**Why at session start and not on demand:**
The agent must see the namespace list from turn 1 — before it writes its first fact. A mid-session tool call to discover namespaces means the agent may have already written a fact under a wrong namespace in an earlier turn. Session-start injection prevents this entirely.

**What happens when the agent creates a new namespace mid-session:**
The in-context `memory_namespaces` list is updated immediately in the agent's context. If it creates `cooking.techniques` in turn 5, all subsequent turns in this session that need to write technique facts write to `cooking.techniques` — not to a second invented name. Consistency within a session is agent-maintained; consistency across sessions is guaranteed by the session-start injection of the current state.

**Index that makes this cheap:**

```sql
CREATE INDEX idx_user_memory_namespace ON user_memory (namespace, is_active);
```

`SELECT DISTINCT namespace WHERE is_active = 1` runs against this index. At 40-namespace cap it is trivial — never more than 40 distinct values to return.

## Namespace Cap Enforcement (40 distinct namespaces)

The 40-cap is a hard ceiling on distinct namespace strings — NOT on rows. One namespace can have unlimited keys and rows. The cap prevents the AI from fragmenting memory into hundreds of micro-namespaces that are never reused.

Enforcement runs inside `write_user_memory` before every write:

```typescript
// count distinct namespaces
const { count } = await db
  .select({ count: sql<number>`count(distinct namespace)` })
  .from(userMemory)
  .get()

// check if this namespace already exists
const exists = await db
  .select({ id: userMemory.id })
  .from(userMemory)
  .where(eq(userMemory.namespace, namespace))
  .limit(1)
  .get()

// only reject if: namespace is NEW and cap is already hit
if (!exists && count >= 40) {
  const list = await getNamespaceList()
  return `REJECTED: namespace cap reached (${count}/40). Use an existing namespace:\n${list}`
}
```

When rejected, the error response includes the current namespace list so the AI can self-correct and retry with an existing namespace. One round trip. No human needed.

## Merge Logic (never overwrite, never lose old data)

```typescript
const existing = await db
  .select()
  .from(userMemory)
  .where(and(eq(userMemory.namespace, namespace), eq(userMemory.key, key)))
  .get()

const mergedValue = existing
  ? { ...JSON.parse(existing.value), ...value }
  : value

// First write (metformin 500mg):
//   existing = null
//   stored   = { dose: "500mg", frequency: "2x daily" }

// Second write (refill, now 1000mg):
//   existing = { dose: "500mg", frequency: "2x daily" }
//   new      = { dose: "1000mg", refill_date: "2026-06-01" }
//   merged   = { dose: "1000mg", frequency: "2x daily", refill_date: "2026-06-01" }
//               ↑ updated        ↑ preserved              ↑ added
```

The AI writes only what it observed right now. The code handles the merge. Old keys are never lost.

## read_count Side Effect — loadMemoryForPrompt

Memory is loaded into every session prompt passively — the AI never explicitly "asks" for it. So `read_count` must increment here, not inside a tool call.

```typescript
async loadMemoryForPrompt(namespaces: string[]): Promise<MemoryEntry[]> {
  const entries = await db
    .select()
    .from(userMemory)
    .where(and(
      inArray(userMemory.namespace, namespaces),
      eq(userMemory.isActive, true),
    ))
    .all()

  // fire and forget — never await, never block the prompt assembly
  db.update(userMemory)
    .set({ readCount: sql`read_count + 1`, lastRead: Date.now() })
    .where(inArray(userMemory.namespace, namespaces))
    .run()

  return entries
}
```

## Indexes

```sql
CREATE INDEX idx_user_memory_namespace   ON user_memory (namespace, is_active);
CREATE INDEX idx_user_memory_is_active   ON user_memory (is_active, last_write DESC);
CREATE INDEX idx_user_memory_source      ON user_memory (source);
```

**Why these indexes:**
- `(namespace, is_active)` — the most common read: load all active entries under a namespace for prompt injection
- `(is_active, last_write)` — Brain maintenance pass: find all active entries ordered by recency to identify stale candidates
- `(source)` — audit queries: "show me everything inferred vs everything declared explicitly"

## Write Rules

- Written ONLY by the `write_user_memory` tool.
- No other code path writes to this table directly.
- Every write goes through Zod validation first, then namespace cap check, then merge, then upsert.
- `updated_at` is always `Date.now()` at write time, set by the tool, never by the caller.
- `write_count` increments on every upsert via `sql\`write_count + 1\``.
- `id` is always `${namespace}:${key}` — constructed by the tool, never passed in by the AI.

## Read Rules

- Passively loaded into every session prompt via `loadMemoryForPrompt()` — `read_count` increments as a side effect.
- Explicitly read by `read_user_memory(namespace, key?)` tool when the AI needs to check a specific fact mid-conversation.
- Read by the Brain maintenance on its maintenance pass to identify stale, low-value, or duplicate entries.
- Active entries only (`isActive = true`) are loaded into prompts. Deactivated entries are invisible to the AI during sessions.

## What Is NOT Stored Here

- Raw event history → `memory_event`
- Personality traits synthesized across facts → `user_personality`
- Procedural skill instructions → `skills`
- Hard allergies and dietary constraints with their confirmation workflow → `constraints`
- Conversation turns → `session_turns`
