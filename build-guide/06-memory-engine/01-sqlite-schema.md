# Memory Engine — SQLite Schema

## What This File Covers

Every table in the `BrioelOrchestrator` DO SQLite — CREATE TABLE SQL, Drizzle schema, column decisions, indexes, write rules, and read rules for all 12 tables. This is the complete data layer of the user's private brain.

All 12 tables live in one SQLite file per user, managed by Drizzle over `this.ctx.storage`. The schema is version-controlled in `backend/src/agents/orchestrator/migrations/`. No table is shared across users. No Supabase.

---

## Table 1 — `memory_event`

Append-only event log. Every meaningful thing the user does. Never updated, never deleted.

```sql
CREATE TABLE memory_event (
  id           TEXT PRIMARY KEY,  -- UUID v4
  user_id      TEXT NOT NULL,
  kind         TEXT NOT NULL,     -- free text: 'product_scanned' | 'sickness_logged' | etc.
  payload_json TEXT NOT NULL,     -- full event details as JSON object
  captured_at  INTEGER NOT NULL,  -- unix ms — when the event actually occurred (offline-safe)
  ingested_at  INTEGER NOT NULL,  -- unix ms — when this row was written to DO
  source       TEXT NOT NULL,     -- 'scanner' | 'receipt' | 'conversation' | 'agent'
  session_id   TEXT,              -- NULL if outside a session
  entity_kind  TEXT,              -- 'product' | 'recipe' | 'place' | NULL
  entity_id    TEXT,              -- external ID of the entity — NULL if no entity
  geo_hash     TEXT               -- 6-char geohash, NULL if location unavailable
);

CREATE INDEX idx_memory_event_kind     ON memory_event (kind, captured_at DESC);
CREATE INDEX idx_memory_event_entity   ON memory_event (entity_kind, entity_id, captured_at DESC);
CREATE INDEX idx_memory_event_captured ON memory_event (captured_at DESC);
CREATE INDEX idx_memory_event_session  ON memory_event (session_id) WHERE session_id IS NOT NULL;
```

```typescript
export const memoryEvent = sqliteTable('memory_event', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),
  kind:        text('kind').notNull(),
  payloadJson: text('payload_json').notNull(),
  capturedAt:  integer('captured_at').notNull(),
  ingestedAt:  integer('ingested_at').notNull(),
  source:      text('source').notNull(),
  sessionId:   text('session_id'),
  entityKind:  text('entity_kind'),
  entityId:    text('entity_id'),
  geoHash:     text('geo_hash'),
})
```

**Write:** Orchestrator DO on any meaningful event. `log_memory_event` tool. Never updated. Never deleted. `ingestedAt` always set by DO at insert time.

**Read:** illness detective (last 72h), recall alerts (by entity_id), behavioral pattern detection (full scan), travel preload alarm (specific travel_intent events).

---

## Table 2 — `user_memory`

Structured declarative facts about the user. AI-written via `write_user_memory` tool. Merges on update — never overwrites.

```sql
CREATE TABLE user_memory (
  id          TEXT PRIMARY KEY,     -- "${namespace}:${key}" — composite, human-readable
  user_id     TEXT NOT NULL,
  namespace   TEXT NOT NULL,        -- dot-separated, max 3 levels: 'health.medications'
  key         TEXT NOT NULL,        -- specific item: 'metformin', 'lactose'
  value       TEXT NOT NULL,        -- JSON object — never a bare string
  confidence  REAL NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL,        -- 'image' | 'conversation' | 'inferred' | 'cron'
  active      INTEGER NOT NULL DEFAULT 1,
  importance  INTEGER NOT NULL DEFAULT 5,  -- 1–10, LLM-assessed at write time
  read_count  INTEGER NOT NULL DEFAULT 0,
  write_count INTEGER NOT NULL DEFAULT 0,
  last_read   INTEGER,
  last_write  INTEGER,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX idx_user_memory_namespace ON user_memory (namespace, active);
CREATE INDEX idx_user_memory_active    ON user_memory (active, last_write DESC);
CREATE INDEX idx_user_memory_source    ON user_memory (source);
```

```typescript
export const userMemory = sqliteTable('user_memory', {
  id:         text('id').primaryKey(),
  userId:     text('user_id').notNull(),
  namespace:  text('namespace').notNull(),
  key:        text('key').notNull(),
  value:      text('value').notNull(),
  confidence: real('confidence').notNull().default(1.0),
  source:     text('source').notNull(),
  active:     integer('active').notNull().default(1),
  importance: integer('importance').notNull().default(5),
  readCount:  integer('read_count').notNull().default(0),
  writeCount: integer('write_count').notNull().default(0),
  lastRead:   integer('last_read'),
  lastWrite:  integer('last_write'),
  updatedAt:  integer('updated_at').notNull(),
})
```

**Key rules:**
- `id` = `"${namespace}:${key}"` — constructed by the tool, never passed in by the AI
- Namespace: regex `/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/`, max 40 distinct namespaces
- Key: regex `/^[a-z][a-z0-9_-]*$/`, max 64 chars
- Value: JSON object spread-merged on update — old keys preserved, new keys added, updated keys replaced
- Active entries only (`active = 1`) loaded into prompts. Facts are never deleted, only deactivated.

**Write:** `write_user_memory` tool only. No direct writes from any other code path.

**Read:** `loadMemoryForPrompt()` at session open (increments `read_count`). `read_user_memory` tool mid-session. Curator on maintenance pass.

---

## Table 3 — `user_personality`

Synthesized personality traits inferred across patterns. Written by Curator only. Never written by the agent mid-session.

```sql
CREATE TABLE user_personality (
  id            TEXT PRIMARY KEY,   -- UUID v4 — stable even if trait name is refined
  user_id       TEXT NOT NULL,
  trait         TEXT NOT NULL UNIQUE, -- lowercase hyphens only: 'stress-eater', 'texture-sensitive'
  summary       TEXT NOT NULL,      -- Curator-written paragraph specific to this user — not a label
  evidence      TEXT NOT NULL,      -- JSON array of user_memory IDs (namespace:key strings)
  strength      REAL NOT NULL,      -- 0.0 to 1.0 — decays if not reinforced
  active        INTEGER NOT NULL DEFAULT 1,
  revised_count INTEGER NOT NULL DEFAULT 0,
  inferred_at   INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX idx_user_personality_active ON user_personality (active, strength DESC);
CREATE INDEX idx_user_personality_seen   ON user_personality (last_seen_at DESC) WHERE active = 1;
```

```typescript
export const userPersonality = sqliteTable('user_personality', {
  id:           text('id').primaryKey(),
  userId:       text('user_id').notNull(),
  trait:        text('trait').notNull().unique(),
  summary:      text('summary').notNull(),
  evidence:     text('evidence').notNull(),
  strength:     real('strength').notNull(),
  active:       integer('active').notNull().default(1),
  revisedCount: integer('revised_count').notNull().default(0),
  inferredAt:   integer('inferred_at').notNull(),
  lastSeenAt:   integer('last_seen_at').notNull(),
  updatedAt:    integer('updated_at').notNull(),
})
```

**Strength decay rules (Curator applies):**
- No new evidence in 30 days → strength −0.03
- Supporting evidence found → strength +0.05, cap 1.0
- Contradicting evidence found → strength −0.1, floor 0.0
- Strength below 0.15 after decay → `active = 0`

**Write:** Curator only. Agent has no tool to write to this table.

**Read:** `load_session_context` at session open — active traits, ordered by `strength DESC`, top N only.

---

## Table 4 — `skills`

Reusable procedural instruction sets. Index always in context. Content loaded on demand via `view_user_skill`.

```sql
CREATE TABLE skills (
  name            TEXT PRIMARY KEY,  -- flat, lowercase-hyphens, max 64 chars
  user_id         TEXT NOT NULL,
  description     TEXT NOT NULL,     -- max 120 chars — the ONLY part shown in the index
  content         TEXT NOT NULL,     -- full markdown procedure — only loaded on view_user_skill()
  tags            TEXT NOT NULL DEFAULT '[]',  -- JSON array — Curator metadata only
  source          TEXT NOT NULL,     -- 'system' | 'user'
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'stale' | 'archived'
  version         INTEGER NOT NULL DEFAULT 1,
  use_count       INTEGER NOT NULL DEFAULT 0,
  last_used_at    INTEGER,
  archived_reason TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_skills_active  ON skills (status, use_count DESC);
CREATE INDEX idx_skills_source  ON skills (source, status);
```

```typescript
export const skills = sqliteTable('skills', {
  name:           text('name').primaryKey(),
  userId:         text('user_id').notNull(),
  description:    text('description').notNull(),
  content:        text('content').notNull(),
  tags:           text('tags').notNull().default('[]'),
  source:         text('source').notNull(),
  status:         text('status').notNull().default('active'),
  version:        integer('version').notNull().default(1),
  useCount:       integer('use_count').notNull().default(0),
  lastUsedAt:     integer('last_used_at'),
  archivedReason: text('archived_reason'),
  createdAt:      integer('created_at').notNull(),
  updatedAt:      integer('updated_at').notNull(),
})
```

**Curator rules (user skills only — source = 'user'):**
- `use_count === 0` and age > 30 days → archive
- `use_count < 3` and `last_used_at` > 60 days ago → archive with reason `stale`
- System skills (`source = 'system'`) are never touched by the Curator

**Write:** `create_user_skill`, `update_user_skill`, `archive_user_skill`, `delete_user_skill` tools. Curator via forwarding protocol (update/archive only, user skills only).

**Read:** skill index (name + description only) injected into every session prompt. Full content loaded by `view_user_skill(name)`.

---

## Table 5 — `skill_versions`

Full content history before every `update_user_skill` call. One row per version.

```sql
CREATE TABLE skill_versions (
  id          TEXT PRIMARY KEY,   -- UUID v4
  skill_name  TEXT NOT NULL,      -- references skills.name
  user_id     TEXT NOT NULL,
  version     INTEGER NOT NULL,   -- which version of the skill this was (before the update)
  content     TEXT NOT NULL,      -- full markdown content of this version
  reason      TEXT NOT NULL,      -- why this update was made
  archived_at INTEGER NOT NULL    -- unix ms — when this version was replaced
);

CREATE INDEX idx_skill_versions_name ON skill_versions (skill_name, version DESC);
```

```typescript
export const skillVersions = sqliteTable('skill_versions', {
  id:         text('id').primaryKey(),
  skillName:  text('skill_name').notNull(),
  userId:     text('user_id').notNull(),
  version:    integer('version').notNull(),
  content:    text('content').notNull(),
  reason:     text('reason').notNull(),
  archivedAt: integer('archived_at').notNull(),
})
```

**Write:** `update_user_skill` execution path only. Before every content overwrite, current content + version + reason are archived here.

**Read:** developer rollback. Never loaded into prompts. Never read by the agent.

---

## Table 6 — `constraints`

Safety-critical. Hard allergies, intolerances, dislikes, dietary identity, boycotts. Confirmation workflow. Never written by Curator.

```sql
CREATE TABLE constraints (
  id                   TEXT PRIMARY KEY,   -- UUID v4
  user_id              TEXT NOT NULL,
  constraint_type      TEXT NOT NULL,  -- 'hard_allergy' | 'intolerance' | 'dislike' | 'dietary_identity' | 'boycott'
  entity_kind          TEXT NOT NULL,  -- 'ingredient' | 'category' | 'brand' | 'place'
  entity_value         TEXT NOT NULL,  -- 'peanuts' | 'vegan' | 'Nestlé'
  status               TEXT NOT NULL DEFAULT 'proposed',  -- 'proposed' | 'confirmed' | 'auto_confirmed' | 'rejected'
  confidence           REAL NOT NULL DEFAULT 0.5,
  evidence             TEXT NOT NULL DEFAULT '[]',  -- JSON array of memory_event IDs
  surfaced_count       INTEGER NOT NULL DEFAULT 0,
  last_surfaced_at     INTEGER,
  confirmation_source  TEXT,   -- 'user_explicit' | 'behavioral_threshold' | NULL
  notes                TEXT,
  proposed_at          INTEGER NOT NULL,
  confirmed_at         INTEGER,
  updated_at           INTEGER NOT NULL
);

CREATE INDEX idx_constraints_active   ON constraints (status, constraint_type);
CREATE INDEX idx_constraints_entity   ON constraints (entity_kind, entity_value, status);
```

```typescript
export const constraints = sqliteTable('constraints', {
  id:                 text('id').primaryKey(),
  userId:             text('user_id').notNull(),
  constraintType:     text('constraint_type').notNull(),
  entityKind:         text('entity_kind').notNull(),
  entityValue:        text('entity_value').notNull(),
  status:             text('status').notNull().default('proposed'),
  confidence:         real('confidence').notNull().default(0.5),
  evidence:           text('evidence').notNull().default('[]'),
  surfacedCount:      integer('surfaced_count').notNull().default(0),
  lastSurfacedAt:     integer('last_surfaced_at'),
  confirmationSource: text('confirmation_source'),
  notes:              text('notes'),
  proposedAt:         integer('proposed_at').notNull(),
  confirmedAt:        integer('confirmed_at'),
  updatedAt:          integer('updated_at').notNull(),
})
```

**Critical rules:**
- `hard_allergy` requires `confirmation_source = 'user_explicit'` — behavioral threshold alone is never enough
- `auto_confirmed` is valid only for dislike and boycott
- Curator never writes to this table — too safety-critical for automated modification
- Never surface the same constraint more than once per 7 days, stop after 5 rejections

**Write:** `propose_user_constraint` and `confirm_user_constraint` tools only.

**Read:** injected into every session system prompt (block 2, directly after SOUL). Scanner checks this before every verdict. Cooking session checks before every recipe suggestion.

---

## Table 7 — `sessions`

One row per interaction — chat, cooking, alarm, background. The envelope. Not the content.

```sql
CREATE TABLE sessions (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  session_type         TEXT NOT NULL,  -- 'chat' | 'cooking' | 'alarm' | 'background'
  parent_session_id    TEXT,           -- UUID of session this compressed from — NULL if not compression
  recipe_id            TEXT,
  alarm_type           TEXT,
  status               TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'compressed' | 'abandoned'
  outcome_summary      TEXT,
  model                TEXT NOT NULL,
  input_tokens         INTEGER NOT NULL DEFAULT 0,
  output_tokens        INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens    INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens   INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd   REAL,
  turn_count           INTEGER NOT NULL DEFAULT 0,
  skills_created       INTEGER NOT NULL DEFAULT 0,
  constraints_proposed INTEGER NOT NULL DEFAULT 0,
  memory_writes        INTEGER NOT NULL DEFAULT 0,
  started_at           INTEGER NOT NULL,
  ended_at             INTEGER,
  end_reason           TEXT
);

CREATE INDEX idx_sessions_user_status ON sessions (user_id, status, started_at DESC);
CREATE INDEX idx_sessions_type        ON sessions (session_type, started_at DESC);
CREATE INDEX idx_sessions_recipe      ON sessions (recipe_id) WHERE recipe_id IS NOT NULL;
```

```typescript
export const sessions = sqliteTable('sessions', {
  id:                  text('id').primaryKey(),
  userId:              text('user_id').notNull(),
  sessionType:         text('session_type').notNull(),
  parentSessionId:     text('parent_session_id'),
  recipeId:            text('recipe_id'),
  alarmType:           text('alarm_type'),
  status:              text('status').notNull().default('active'),
  outcomeSummary:      text('outcome_summary'),
  model:               text('model').notNull(),
  inputTokens:         integer('input_tokens').notNull().default(0),
  outputTokens:        integer('output_tokens').notNull().default(0),
  cacheReadTokens:     integer('cache_read_tokens').notNull().default(0),
  cacheWriteTokens:    integer('cache_write_tokens').notNull().default(0),
  estimatedCostUsd:    real('estimated_cost_usd'),
  turnCount:           integer('turn_count').notNull().default(0),
  skillsCreated:       integer('skills_created').notNull().default(0),
  constraintsProposed: integer('constraints_proposed').notNull().default(0),
  memoryWrites:        integer('memory_writes').notNull().default(0),
  startedAt:           integer('started_at').notNull(),
  endedAt:             integer('ended_at'),
  endReason:           text('end_reason'),
})
```

---

## Table 8 — `session_turns` (+ FTS5 virtual tables)

One row per conversation turn. The actual content inside sessions.

```sql
CREATE TABLE session_turns (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  turn_number   INTEGER NOT NULL,  -- monotonically increasing within session, starts at 1
  role          TEXT NOT NULL,     -- 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content       TEXT NOT NULL,
  tool_name     TEXT,
  tool_input    TEXT,
  tool_result   TEXT,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE INDEX idx_session_turns_session ON session_turns (session_id, turn_number ASC);
CREATE INDEX idx_session_turns_user    ON session_turns (user_id, created_at DESC);

-- FTS5 over content — keyword search within session history
CREATE VIRTUAL TABLE session_turns_fts USING fts5(
  content,
  content=session_turns,
  content_rowid=rowid,
  tokenize='unicode61'
);

-- Trigram FTS for partial/prefix matching
CREATE VIRTUAL TABLE session_turns_fts_trigram USING fts5(
  content,
  content=session_turns,
  content_rowid=rowid,
  tokenize='trigram'
);
```

```typescript
export const sessionTurns = sqliteTable('session_turns', {
  id:          text('id').primaryKey(),
  sessionId:   text('session_id').notNull(),
  userId:      text('user_id').notNull(),
  turnNumber:  integer('turn_number').notNull(),
  role:        text('role').notNull(),
  content:     text('content').notNull(),
  toolName:    text('tool_name'),
  toolInput:   text('tool_input'),
  toolResult:  text('tool_result'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  createdAt:   integer('created_at').notNull(),
})
```

**Turn number:** explicit, monotonic, starts at 1 per session. Derived from `agent_state` counter (`turn_counter.{sessionId}`), not from MAX — eliminates read-before-write race.

---

## Table 9 — `recipes`

User's saved recipe collection. One row per distinct recipe.

```sql
CREATE TABLE recipes (
  id              TEXT PRIMARY KEY,   -- UUID v4
  user_id         TEXT NOT NULL,
  title           TEXT NOT NULL,
  source          TEXT NOT NULL,      -- 'cooking_session' | 'url' | 'manual' | 'family_capture'
  source_session  TEXT,               -- session_id that produced this recipe
  source_url      TEXT,               -- URL if source = 'url'
  content         TEXT NOT NULL,      -- JSON: { ingredients[], steps[], notes, timing, servings, cultural_notes }
  cook_count      INTEGER NOT NULL DEFAULT 0,
  last_cooked_at  INTEGER,
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived'
  confidence      REAL NOT NULL DEFAULT 1.0,       -- 0.0–1.0 for URL-extracted recipes
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_recipes_active    ON recipes (user_id, status, last_cooked_at DESC);
CREATE INDEX idx_recipes_source    ON recipes (source, created_at DESC);
```

```typescript
export const recipes = sqliteTable('recipes', {
  id:            text('id').primaryKey(),
  userId:        text('user_id').notNull(),
  title:         text('title').notNull(),
  source:        text('source').notNull(),
  sourceSession: text('source_session'),
  sourceUrl:     text('source_url'),
  content:       text('content').notNull(),
  cookCount:     integer('cook_count').notNull().default(0),
  lastCookedAt:  integer('last_cooked_at'),
  status:        text('status').notNull().default('active'),
  confidence:    real('confidence').notNull().default(1.0),
  createdAt:     integer('created_at').notNull(),
  updatedAt:     integer('updated_at').notNull(),
})
```

---

## Table 10 — `scheduled_alarms`

The time-based work queue. DO alarm slot reads from here. One row per pending alarm.

```sql
CREATE TABLE scheduled_alarms (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  alarm_type     TEXT NOT NULL,   -- free text — no fixed enum
  payload        TEXT NOT NULL,   -- JSON object — alarm handler reads this
  status         TEXT NOT NULL DEFAULT 'pending',  -- lifecycle: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  attempts       INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  label          TEXT,
  scheduled_at   INTEGER NOT NULL,
  started_at     INTEGER,
  completed_at   INTEGER,
  action_outcome_status  TEXT,    -- outcome of the action triggered by this alarm, distinct from lifecycle status. NULL until an outcome lands. e.g. 'calling' | 'answered' | 'missed' | 'notified' | 'failed'
  action_outcome_json    TEXT,    -- JSON — alarm-type-specific action outcome. medication call: {"took":1,"call_sid":"...","answered_at":123}. travel preload: {"products_cached":142}
  created_at     INTEGER NOT NULL
);

CREATE INDEX idx_alarms_pending ON scheduled_alarms (status, scheduled_at ASC);
CREATE INDEX idx_alarms_type    ON scheduled_alarms (alarm_type, status);
```

```typescript
export const scheduledAlarms = sqliteTable('scheduled_alarms', {
  id:            text('id').primaryKey(),
  userId:        text('user_id').notNull(),
  alarmType:     text('alarm_type').notNull(),
  payload:       text('payload').notNull(),
  status:        text('status').notNull().default('pending'),
  attempts:      integer('attempts').notNull().default(0),
  failureReason: text('failure_reason'),
  label:         text('label'),
  scheduledAt:   integer('scheduled_at').notNull(),
  startedAt:     integer('started_at'),
  completedAt:   integer('completed_at'),
  actionOutcomeStatus: text('action_outcome_status'), // action outcome — NULL until it lands
  actionOutcomeJson:   text('action_outcome_json'),   // JSON — alarm-type-specific action outcome payload
  createdAt:     integer('created_at').notNull(),
})
```

### Why `action_outcome_status` + `action_outcome_json` (one generic action outcome surface)

Some alarms have an async outcome that arrives *after* the alarm fires — a medication call the user answers, a travel preload that finishes caching, an illness-detective pass that lands on a culprit. That outcome is alarm-type-specific.

The wrong move is a dedicated table per alarm type (`medication_reminders`, `travel_preloads`, …) — every one duplicates the same shape (a status, an attempt time, a type-specific outcome blob) and forces a schema change for every new alarm type. Instead, two columns on `scheduled_alarms` carry every action outcome:

- `action_outcome_status` — the outcome state from the action the alarm triggered, separate from the row's lifecycle `status`. The alarm `status` is `completed` once it fired and dispatched; `action_outcome_status` tracks what came back (`answered`, `missed`, `notified`, `failed`).
- `action_outcome_json` — the type-specific action outcome payload.

```
medication_reminder → action_outcome_status: 'answered'   action_outcome_json: {"took":1,"call_sid":"vapi_xxx","answered_at":1718000000000}
travel_preload      → action_outcome_status: 'completed'  action_outcome_json: {"products_cached":142,"regions_loaded":3}
illness_detective   → action_outcome_status: 'completed'  action_outcome_json: {"top_culprit":"product_x","confidence":0.78}
```

No new alarm type ever needs a new table. This is why there is no separate `medication_reminders` table — the medication-call outcome is just an alarm outcome (`build-guide/29-health-intelligence/02-medication-reminders.md`).

---

## Table 11 — `agent_state`

DO operational memory. Key-value. Survives eviction.

```sql
CREATE TABLE agent_state (
  key        TEXT PRIMARY KEY,   -- dot-namespaced: 'do.initialized', 'curator.last_run'
  user_id    TEXT NOT NULL,
  value      TEXT NOT NULL,      -- always TEXT — reader parses to appropriate type
  updated_at INTEGER NOT NULL
);
```

```typescript
export const agentState = sqliteTable('agent_state', {
  key:       text('key').primaryKey(),
  userId:    text('user_id').notNull(),
  value:     text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
})
```

**Known keys at launch:** `do.initialized`, `turn_counter.{sessionId}`, `curator.last_run`, `pattern_detection.last_run`, `active_session_id`, `memory.write_failure.{sessionId}`, `curator.anomaly.{runId}`

---

## Table 12 — `__drizzle_migrations`

Managed entirely by Drizzle. Never touched by application code.

```sql
-- Created automatically by drizzle-orm/durable-sqlite/migrator
CREATE TABLE __drizzle_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hash       TEXT NOT NULL UNIQUE,
  created_at INTEGER
);
```

**Rules:** Never edit an applied migration file. Never write to this table in application code. The Drizzle migrator runs at every DO startup before any other operation.

---

## DO Startup Sequence — Full Order

```
1. drizzle-orm/durable-sqlite/migrator runs
   → reads __drizzle_migrations
   → applies unapplied migrations in order

2. PRAGMA journal_mode=WAL
   → runs after migrations complete
   → persists for lifetime of this DO instance

3. agent_state: read 'do.initialized'
   → missing or '0' → run initialization:
       seed system skills into skills table
       set default agent_state keys
       schedule first curator_run, pattern_detection, recall_check alarms
       write 'do.initialized' = '1'
   → '1' → ready, handle incoming request
```

All three steps run inside `ctx.blockConcurrencyWhile()` at constructor time.
