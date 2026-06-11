# Brain Memory — SQLite Schema

## What This File Covers

Every table in the `BrioelaBrain` DO SQLite — CREATE TABLE SQL, Drizzle schema, column decisions, indexes, write rules, and read rules for the core memory tables plus feature-owned private extensions. This is the complete data layer of the user's private brain.

All private tables live in one SQLite file per user, managed by Drizzle over `this.ctx.storage`. Drizzle schema files are the source of truth, Drizzle Kit generates the SQLite migration artifacts, and `drizzle-orm/durable-sqlite/migrator` applies them inside the Brain DO startup path. Production rollout is governed by the Brain SQLite migration runtime in `build-guide/05-brain/08-brain-sqlite-migration-runtime.md`. No table is shared across users. No Supabase.

Migration safety is part of the schema contract. Drizzle tracks which generated migration files applied through `__drizzle_migrations`; Brioela tracks whether the user's Brain is safe to serve through product migration readiness tables and smoke results. Both layers are required.

Hard database rule: Brain code uses Drizzle as the database language. Raw Durable Object SQLite is metal and is not used by feature code. Reads and writes go through typed Drizzle repositories/stores, with schema decoding at repository boundaries.

SQLite stores only `NULL`, `INTEGER`, `REAL`, `TEXT`, and `BLOB`, so Brain schema hardness must be explicit in Drizzle:

- Closed lifecycle/category values use both Drizzle `text(..., { enum })` typing and Drizzle `check(...)` constraints. TypeScript union inference alone is not a database guarantee.
- Binary flags use Drizzle boolean mode over SQLite integer storage, plus a `CHECK` limiting storage to `0` or `1`.
- JSON stored in `TEXT` must be valid JSON at the database boundary. Object fields use `json_valid(column) AND json_type(column) = 'object'`; array fields use `json_valid(column) AND json_type(column) = 'array'`; nullable JSON fields guard with `column IS NULL OR ...`.
- Scores, confidence, importance, counters, versions, and timestamps use numeric `CHECK` constraints. The database should reject impossible values before repository code sees them.
- Open extension points stay open text. Do not turn future-growth surfaces such as `memory_event.kind` or `scheduled_alarms.alarm_type` into enums just because launch values are known. `recipes.origin` is Zod-enforced at write boundaries.

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

**Write:** Brain DO on any meaningful event. `log_memory_event` tool. Never updated. Never deleted. `ingestedAt` always set by DO at insert time.

**Read:** illness detective (last 72h), recall alerts (by entity_id), behavioral behavior pattern detection (full scan), travel preload alarm (specific travel_intent events).

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
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  importance  INTEGER NOT NULL DEFAULT 5,  -- 1–10, LLM-assessed at write time
  read_count  INTEGER NOT NULL DEFAULT 0,
  write_count INTEGER NOT NULL DEFAULT 0,
  last_read   INTEGER,
  last_write  INTEGER,
  updated_at  INTEGER NOT NULL
  CHECK (json_valid(value) AND json_type(value) = 'object'),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (importance >= 1 AND importance <= 10),
  CHECK (read_count >= 0),
  CHECK (write_count >= 0),
  CHECK (last_read IS NULL OR last_read >= 0),
  CHECK (last_write IS NULL OR last_write >= 0),
  CHECK (updated_at >= 0)
);

CREATE INDEX idx_user_memory_namespace ON user_memory (namespace, is_active);
CREATE INDEX idx_user_memory_is_active ON user_memory (is_active, last_write DESC);
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
  isActive:   integer('is_active', { mode: 'boolean' }).notNull().default(true),
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
- Active entries only (`isActive = true`) loaded into prompts. Facts are never deleted, only deactivated.

**Write:** `write_user_memory` tool only. No direct writes from any other code path.

**Read:** `loadMemoryForPrompt()` at session open (increments `read_count`). `read_user_memory` tool mid-session. Brain maintenance on maintenance pass.

---

## Table 3 — `user_personality`

Synthesized personality traits inferred across patterns. Written by Brain maintenance only. Never written by the agent mid-session.

```sql
CREATE TABLE user_personality (
  id            TEXT PRIMARY KEY,   -- UUID v4 — stable even if trait name is refined
  user_id       TEXT NOT NULL,
  trait         TEXT NOT NULL UNIQUE, -- lowercase hyphens only: 'stress-eater', 'texture-sensitive'
  summary       TEXT NOT NULL,      -- Brain maintenance-written paragraph specific to this user — not a label
  evidence      TEXT NOT NULL,      -- JSON array of user_memory IDs (namespace:key strings)
  strength      REAL NOT NULL,      -- 0.0 to 1.0 — decays if not reinforced
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  revised_count INTEGER NOT NULL DEFAULT 0,
  inferred_at   INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
  CHECK (json_valid(evidence) AND json_type(evidence) = 'array'),
  CHECK (strength >= 0 AND strength <= 1),
  CHECK (revised_count >= 0),
  CHECK (inferred_at >= 0),
  CHECK (last_seen_at >= inferred_at),
  CHECK (updated_at >= inferred_at)
);

CREATE INDEX idx_user_personality_is_active ON user_personality (is_active, strength DESC);
CREATE INDEX idx_user_personality_seen   ON user_personality (last_seen_at DESC) WHERE is_active = 1;
```

```typescript
export const userPersonality = sqliteTable('user_personality', {
  id:           text('id').primaryKey(),
  userId:       text('user_id').notNull(),
  trait:        text('trait').notNull().unique(),
  summary:      text('summary').notNull(),
  evidence:     text('evidence').notNull(),
  strength:     real('strength').notNull(),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  revisedCount: integer('revised_count').notNull().default(0),
  inferredAt:   integer('inferred_at').notNull(),
  lastSeenAt:   integer('last_seen_at').notNull(),
  updatedAt:    integer('updated_at').notNull(),
})
```

**Strength decay rules (Brain maintenance applies):**
- No new evidence in 30 days → strength −0.03
- Supporting evidence found → strength +0.05, cap 1.0
- Contradicting evidence found → strength −0.1, floor 0.0
- Strength below 0.15 after decay → `isActive = false`

**Write:** Brain maintenance only. Agent has no tool to write to this table.

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
  tags            TEXT NOT NULL DEFAULT '[]',  -- JSON array — Brain maintenance metadata only
  source          TEXT NOT NULL,     -- 'system' | 'user'
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'stale' | 'archived'
  version         INTEGER NOT NULL DEFAULT 1,
  use_count       INTEGER NOT NULL DEFAULT 0,
  last_used_at    INTEGER,
  archived_reason TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
  CHECK (json_valid(tags) AND json_type(tags) = 'array'),
  CHECK (source IN ('system', 'user')),
  CHECK (status IN ('active', 'stale', 'archived')),
  CHECK (version >= 1),
  CHECK (use_count >= 0),
  CHECK (last_used_at IS NULL OR last_used_at >= 0),
  CHECK (created_at >= 0),
  CHECK (updated_at >= created_at)
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
  source:         text('source', { enum: skillSource }).notNull(),
  status:         text('status', { enum: skillStatus }).notNull().default('active'),
  version:        integer('version').notNull().default(1),
  useCount:       integer('use_count').notNull().default(0),
  lastUsedAt:     integer('last_used_at'),
  archivedReason: text('archived_reason'),
  createdAt:      integer('created_at').notNull(),
  updatedAt:      integer('updated_at').notNull(),
})
```

**Brain maintenance rules (user skills only — source = 'user'):**
- `use_count === 0` and age > 30 days → archive
- `use_count < 3` and `last_used_at` > 60 days ago → archive with reason `stale`
- System skills (`source = 'system'`) are never touched by the Brain maintenance

**Write:** `create_user_skill`, `update_user_skill`, `archive_user_skill`, `delete_user_skill` tools. Brain maintenance via typed Brain RPC (update/archive only, user skills only).

**Read:** skill index (name + description only) injected into every session prompt. Full content loaded by `view_user_skill(name)`.

---

## Table 5 — `skill_versions`

Full content history before every `update_user_skill` call. One row per version.

```sql
CREATE TABLE skill_versions (
  id            TEXT PRIMARY KEY,   -- UUID v4
  skill_name    TEXT NOT NULL,      -- references skills.name
  user_id       TEXT NOT NULL,
  version       INTEGER NOT NULL,   -- which version of the skill this was (before the update)
  content       TEXT NOT NULL,      -- full markdown content of this version
  description   TEXT NOT NULL,      -- description at this version
  updated_by    TEXT NOT NULL,      -- 'agent' | 'brain_maintenance'
  update_reason TEXT NOT NULL,      -- why this update was made
  archived_at   INTEGER NOT NULL    -- unix ms — when this version was replaced
  CHECK (version >= 1),
  CHECK (updated_by IN ('agent', 'brain_maintenance')),
  CHECK (archived_at >= 0)
);

CREATE INDEX idx_skill_versions_name ON skill_versions (skill_name, version DESC);
```

```typescript
export const skillVersions = sqliteTable('skill_versions', {
  id:           text('id').primaryKey(),
  skillName:    text('skill_name').notNull(),
  userId:       text('user_id').notNull(),
  version:      integer('version').notNull(),
  content:      text('content').notNull(),
  description:  text('description').notNull(),
  updatedBy:    text('updated_by').notNull(),
  updateReason: text('update_reason').notNull(),
  archivedAt:   integer('archived_at').notNull(),
})
```

**Write:** `update_user_skill` execution path only. Before every content overwrite, current content + version + description + updated_by + update_reason are archived here.

**Read:** developer rollback. Never loaded into prompts. Never read by the agent.

---

## Table 6 — `constraints`

Safety-critical. Hard allergies, intolerances, dislikes, dietary identity, boycotts. Confirmation workflow. Never written by Brain maintenance.

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
  CHECK (constraint_type IN ('hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott')),
  CHECK (entity_kind IN ('ingredient', 'category', 'brand', 'place')),
  CHECK (status IN ('proposed', 'confirmed', 'auto_confirmed', 'rejected')),
  CHECK (confirmation_source IS NULL OR confirmation_source IN ('user_explicit', 'behavioral_threshold')),
  CHECK (json_valid(evidence) AND json_type(evidence) = 'array'),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (surfaced_count >= 0),
  CHECK (last_surfaced_at IS NULL OR last_surfaced_at >= 0),
  CHECK (proposed_at >= 0),
  CHECK (confirmed_at IS NULL OR confirmed_at >= proposed_at),
  CHECK (updated_at >= proposed_at)
);

CREATE INDEX idx_constraints_active   ON constraints (status, constraint_type);
CREATE INDEX idx_constraints_entity   ON constraints (entity_kind, entity_value, status);
```

```typescript
export const constraints = sqliteTable('constraints', {
  id:                 text('id').primaryKey(),
  userId:             text('user_id').notNull(),
  constraintType:     text('constraint_type', { enum: constraintKind }).notNull(),
  entityKind:         text('entity_kind', { enum: entityKind }).notNull(),
  entityValue:        text('entity_value').notNull(),
  status:             text('status', { enum: constraintStatus }).notNull().default('proposed'),
  confidence:         real('confidence').notNull().default(0.5),
  evidence:           text('evidence').notNull().default('[]'),
  surfacedCount:      integer('surfaced_count').notNull().default(0),
  lastSurfacedAt:     integer('last_surfaced_at'),
  confirmationSource: text('confirmation_source', { enum: confirmationSource }),
  notes:              text('notes'),
  proposedAt:         integer('proposed_at').notNull(),
  confirmedAt:        integer('confirmed_at'),
  updatedAt:          integer('updated_at').notNull(),
})
```

**Critical rules:**
- `hard_allergy` requires `confirmation_source = 'user_explicit'` — behavioral threshold alone is never enough
- `auto_confirmed` is valid only for dislike and boycott
- Brain maintenance never writes to this table — too safety-critical for automated modification
- Never surface the same constraint more than once per 7 days, stop after 5 rejections

**Write:** `propose_user_constraint` and `confirm_user_constraint` tools only.

**Read:** injected into every session system prompt (block 2, directly after BrioelaIdentity). Scanner checks this before every verdict. Cooking session checks before every recipe suggestion.

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
  CHECK (session_type IN ('chat', 'cooking', 'alarm', 'background')),
  CHECK (status IN ('active', 'completed', 'compressed', 'abandoned')),
  CHECK (input_tokens >= 0),
  CHECK (output_tokens >= 0),
  CHECK (cache_read_tokens >= 0),
  CHECK (cache_write_tokens >= 0),
  CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
  CHECK (turn_count >= 0),
  CHECK (skills_created >= 0),
  CHECK (constraints_proposed >= 0),
  CHECK (memory_writes >= 0),
  CHECK (started_at >= 0),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_sessions_user_status ON sessions (user_id, status, started_at DESC);
CREATE INDEX idx_sessions_type        ON sessions (session_type, started_at DESC);
CREATE INDEX idx_sessions_recipe      ON sessions (recipe_id) WHERE recipe_id IS NOT NULL;
```

```typescript
export const sessions = sqliteTable('sessions', {
  id:                  text('id').primaryKey(),
  userId:              text('user_id').notNull(),
  sessionType:         text('session_type', { enum: sessionKind }).notNull(),
  parentSessionId:     text('parent_session_id'),
  recipeId:            text('recipe_id'),
  alarmType:           text('alarm_type'),
  status:              text('status', { enum: sessionStatus }).notNull().default('active'),
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
  CHECK (turn_number >= 1),
  CHECK (role IN ('user', 'assistant', 'tool_call', 'tool_result')),
  CHECK (input_tokens >= 0),
  CHECK (output_tokens >= 0),
  CHECK (created_at >= 0)
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
  role:        text('role', { enum: turnRole }).notNull(),
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
  id                TEXT PRIMARY KEY,   -- UUID v4
  user_id           TEXT NOT NULL,
  title             TEXT NOT NULL,
  origin            TEXT NOT NULL,      -- cooking_session | family_capture | user_written | share_import
  session_id        TEXT,
  link_url          TEXT,
  content           TEXT NOT NULL,      -- JSON: { ingredients[], steps[], notes, timing, servings, cultural_notes }
  version           INTEGER NOT NULL DEFAULT 1, -- current version of the recipe
  cook_count        INTEGER NOT NULL DEFAULT 0,
  last_cooked_at    INTEGER,
  status            TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived'
  confidence        REAL NOT NULL DEFAULT 1.0,       -- 0.0–1.0 for URL-extracted recipes
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
  CHECK (json_valid(content) AND json_type(content) = 'object'),
  CHECK (json_extract(content, '$.title') = title),
  CHECK (version >= 1),
  CHECK (cook_count >= 0),
  CHECK (last_cooked_at IS NULL OR last_cooked_at >= 0),
  CHECK (status IN ('active', 'archived')),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (created_at >= 0),
  CHECK (updated_at >= created_at)
);

CREATE TABLE recipe_versions (
  id            TEXT PRIMARY KEY,   -- UUID v4
  recipe_id     TEXT NOT NULL,      -- logical reference to recipes.id
  user_id       TEXT NOT NULL,
  version       INTEGER NOT NULL,   -- recipe version before incrementing
  content       TEXT NOT NULL,      -- JSON content before the update
  updated_by    TEXT NOT NULL,      -- 'agent' | 'brain_maintenance'
  update_reason TEXT NOT NULL,      -- why updated
  archived_at   INTEGER NOT NULL    -- unix ms when version archived
  CHECK (version >= 1),
  CHECK (updated_by IN ('agent', 'brain_maintenance')),
  CHECK (archived_at >= 0)
);

CREATE INDEX idx_recipes_active    ON recipes (user_id, status, last_cooked_at DESC);
CREATE INDEX idx_recipes_origin    ON recipes (origin, created_at DESC);
CREATE INDEX idx_recipe_versions   ON recipe_versions (recipe_id, version DESC);
```

```typescript
export const recipes = sqliteTable('recipes', {
  id:              text('id').primaryKey(),
  userId:          text('user_id').notNull(),
  title:           text('title').notNull(),
  origin:          text('origin').notNull(),
  sessionId:       text('session_id'),
  linkUrl:         text('link_url'),
  content:         text('content').notNull(),
  version:         integer('version').notNull().default(1),
  cookCount:       integer('cook_count').notNull().default(0),
  lastCookedAt:    integer('last_cooked_at'),
  status:          text('status', { enum: recipeStatus }).notNull().default('active'),
  confidence:      real('confidence').notNull().default(1.0),
  createdAt:       integer('created_at').notNull(),
  updatedAt:       integer('updated_at').notNull(),
}, (table) => [
  check('recipes_title_matches_content_check', sql`json_extract(${table.content}, '$.title') = ${table.title}`),
])

export const recipeVersions = sqliteTable('recipe_versions', {
  id:           text('id').primaryKey(),
  recipeId:     text('recipe_id').notNull(),
  userId:       text('user_id').notNull(),
  version:      integer('version').notNull(),
  content:      text('content').notNull(),
  updatedBy:    text('updated_by').notNull(),
  updateReason: text('update_reason').notNull(),
  archivedAt:   integer('archived_at').notNull(),
})
```

---

## Health Intelligence Extension Tables

Health Intelligence adds three private tables to the same Brain DO SQLite file. They are not
Supabase tables and are not shared across users. `user_memory.health.*` can mirror summaries for prompt
context, but these tables are the operational source for scan safety logic, reminders, and Health
Agent passes.

### `medications`

```sql
CREATE TABLE medications (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  medication_name     TEXT NOT NULL,
  medication_category TEXT NOT NULL,
  dose_mg             REAL,
  dose_unit           TEXT,
  frequency           TEXT NOT NULL,
  reminder_times      TEXT NOT NULL,
  with_food           INTEGER,
  notes               TEXT,
  source              TEXT NOT NULL,
  active              INTEGER NOT NULL DEFAULT 1,
  started_at          INTEGER,
  ended_at            INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE INDEX idx_medications_active ON medications (user_id, active, medication_category);
```

### `health_events`

```sql
CREATE TABLE health_events (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL,
  event_type            TEXT NOT NULL,
  severity              INTEGER,
  onset_at              INTEGER NOT NULL,
  logged_at             INTEGER NOT NULL,
  source                TEXT NOT NULL,
  payload_json          TEXT NOT NULL,
  possible_associations TEXT,
  resolved_at           INTEGER,
  created_at            INTEGER NOT NULL
);

CREATE INDEX idx_health_events_recent ON health_events (user_id, onset_at DESC);
CREATE INDEX idx_health_events_type   ON health_events (user_id, event_type, onset_at DESC);
```

### `health_captures`

```sql
CREATE TABLE health_captures (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  capture_type         TEXT NOT NULL,
  domain               TEXT NOT NULL,
  metric_key           TEXT,
  value_json           TEXT NOT NULL,
  unit                 TEXT,
  source_type          TEXT NOT NULL,
  source_detail        TEXT,
  source_connection_id TEXT,
  captured_at          INTEGER NOT NULL,
  ingested_at          INTEGER NOT NULL,
  confidence           REAL,
  tags                 TEXT,
  created_at           INTEGER NOT NULL
);

CREATE INDEX idx_health_captures_recent ON health_captures (user_id, captured_at DESC);
CREATE INDEX idx_health_captures_source ON health_captures (user_id, source_connection_id);
```

**Routing:** prescription photos create a `health_captures` evidence row and a normalized
`medications` row. Symptoms/stool/rash/negative responses create `health_events`. Wearable summaries
and lab/measurement captures create `health_captures`. Stable user-facing summaries may mirror into
`user_memory`, but `user_memory` is not the operational source for these health records.

---

## Table 10 — `scheduled_alarms`

The time-based work queue. DO alarm slot reads from here. One row per pending alarm.

```sql
CREATE TABLE scheduled_alarms (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  alarm_type     TEXT NOT NULL,   -- free text — no fixed enum
  triggering_session_id TEXT,     -- session that scheduled this alarm — NULL for system-scheduled
  payload        TEXT NOT NULL,   -- JSON object — alarm handler reads this
  sdk_schedule_id TEXT,           -- Agents SDK schedule id used as wake/callback mechanism
  status         TEXT NOT NULL DEFAULT 'pending',  -- lifecycle: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  attempts       INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  cancelled_at   INTEGER,
  cancel_reason  TEXT,
  rescheduled_from_alarm_id TEXT,
  rescheduled_to_alarm_id   TEXT,
  label          TEXT,
  scheduled_at   INTEGER NOT NULL,
  started_at     INTEGER,
  completed_at   INTEGER,
  action_outcome_status  TEXT,    -- outcome of the action triggered by this alarm, distinct from lifecycle status. NULL until an outcome lands. e.g. 'calling' | 'answered' | 'missed' | 'notified' | 'failed'
  action_outcome_json    TEXT,    -- JSON — alarm-type-specific action outcome. medication call: {"took":1,"call_sid":"...","answered_at":123}. travel preload: {"products_cached":142}
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
  CHECK (json_valid(payload) AND json_type(payload) = 'object'),
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CHECK (attempts >= 0),
  CHECK (cancelled_at IS NULL OR cancelled_at >= 0),
  CHECK (scheduled_at >= 0),
  CHECK (started_at IS NULL OR started_at >= scheduled_at),
  CHECK (completed_at IS NULL OR completed_at >= scheduled_at),
  CHECK (action_outcome_json IS NULL OR (json_valid(action_outcome_json) AND json_type(action_outcome_json) = 'object')),
  CHECK (created_at >= 0),
  CHECK (updated_at >= created_at)
);

CREATE INDEX idx_alarms_pending ON scheduled_alarms (status, scheduled_at ASC);
CREATE INDEX idx_alarms_type    ON scheduled_alarms (alarm_type, status);
```

```typescript
export const scheduledAlarms = sqliteTable('scheduled_alarms', {
  id:            text('id').primaryKey(),
  userId:        text('user_id').notNull(),
  alarmType:     text('alarm_type').notNull(),
  triggeringSessionId: text('triggering_session_id'),
  payload:       text('payload').notNull(),
  sdkScheduleId: text('sdk_schedule_id'),
  status:        text('status', { enum: scheduledAlarmStatus }).notNull().default('pending'),
  attempts:      integer('attempts').notNull().default(0),
  failureReason: text('failure_reason'),
  cancelledAt:   integer('cancelled_at'),
  cancelReason:  text('cancel_reason'),
  rescheduledFromAlarmId: text('rescheduled_from_alarm_id'),
  rescheduledToAlarmId:   text('rescheduled_to_alarm_id'),
  label:         text('label'),
  scheduledAt:   integer('scheduled_at').notNull(),
  startedAt:     integer('started_at'),
  completedAt:   integer('completed_at'),
  actionOutcomeStatus: text('action_outcome_status'), // action outcome — NULL until it lands
  actionOutcomeJson:   text('action_outcome_json'),   // JSON — alarm-type-specific action outcome payload
  createdAt:     integer('created_at').notNull(),
  updatedAt:     integer('updated_at').notNull(),
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
  key        TEXT PRIMARY KEY,   -- dot-namespaced: 'do.initialized', 'brain_maintenance.last_run'
  user_id    TEXT NOT NULL,
  value      TEXT NOT NULL,      -- always TEXT — reader parses to appropriate type
  updated_at INTEGER NOT NULL
  CHECK (json_valid(value)),
  CHECK (updated_at >= 0)
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

**Known keys at launch:** `do.initialized`, `turn_counter.{sessionId}`, `brain_maintenance.last_run`, `behavior_pattern_detection.last_run`, `active_session_id`, `memory.write_failure.{sessionId}`, `brain_maintenance.anomaly.{runId}`

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

**Rules:** Never edit an applied migration file. Never write to this table in application code. The Drizzle migrator runs inside the Brain startup gate before normal Brain work. Brioela readiness must still pass before serving product code.

---

## DO Startup Sequence — Full Order

```
1. Create typed Drizzle DB over DO SQLite

2. Brain migration runtime enters startup gate
   → acquires migration lock
   → checks rollout policy
   → calls drizzle-orm/durable-sqlite/migrator
   → reads __drizzle_migrations
   → applies unapplied generated migrations in order
   → runs Brioela smoke tests through Drizzle repositories
   → writes readiness state

3. agent_state: read 'do.initialized'
   → missing or '0' → run initialization:
       seed system skills into skills table
       set default agent_state keys
       schedule first brain_maintenance_run, behavior_pattern_detection, recall_check alarms
       write 'do.initialized' = '1'
   → '1' → ready, handle incoming request
```

All three steps run inside `ctx.blockConcurrencyWhile()` at constructor time.
