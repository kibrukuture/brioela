# Table: skills

## Why This Table Exists

`skills` holds reusable procedural instruction sets — markdown documents the agent loads on demand when it recognizes a task that matches a known procedure. Skills are how the agent gets better at specific tasks over time without retraining.

A skill is not a fact (`user_memory`). It is not a personality trait (`user_personality`). It is a procedure — a step-by-step instruction set the agent follows when doing something it has learned to do well.

Examples:
- `cooking-coach` — step-by-step voice cooking methodology with intervention logic
- `illness-detective` — food history analysis procedure for foodborne illness investigation
- `ethiopian-spice-layering` — technique for building berbere-style spice depth in three stages (agent-created after a grandma session)

The agent does not pre-load all skills into every prompt. It reads a compact index (one line per skill: `name: description`) injected into every system prompt, recognizes which skill is relevant, and calls `skill_view(name)` to load the full content only when needed. The full content costs tokens only when actually used.

## Decision: name is the primary key, not UUID

Unlike `user_personality` where the Curator can refine trait names, skill names are never renamed. `skill_update(name, content, reason)` changes content only — the name is the stable address. `skill_view(name)` does exact string match on the primary key. A UUID primary key would add a layer of indirection that `skill_view` has to work around for no benefit. Name as primary key is correct here, backed directly by how the tool works — spec 09, line 148.

## Decision: description has a hard 120-char cap

Every session prompt includes one line per active skill: `name: description`. This is the only thing the LLM reads to decide which skill to load. If description is vague, skill selection breaks. If it is too long, the index becomes expensive and noisy. 120 characters is enough to be specific, short enough to keep the index cheap at scale. Enforced by Zod at the tool boundary.

## Decision: tags are Curator-only metadata, not used in index injection

Tags could theoretically serve skill discovery. But skill selection in this system is done by the model reading the description — not by tag filtering. The model understands intent; tag matching understands exact strings. Tags are kept as Curator metadata only — for grouping, consolidation detection, and overlap analysis during the Curator's maintenance pass. They are never used in the active index injection path.

## Decision: version integer + separate skill_versions table

`skill_update` rewrites content. Without history, a bad Curator pass or a bad agent update permanently destroys a skill that took months of real sessions to build. `version` increments on every update. The full previous content is archived to `skill_versions` before every overwrite. Rollback is a developer action — the agent has no rollback tool. See `05-skill-versions.md`.

## Decision: system skills are never touched by the Curator

`source = 'system'` rows are seeded at DO initialization and are permanent. The Curator only manages `source = 'user'` skills. System skills can only be changed in code and reseeded. This is enforced in the Curator logic, not in SQL — SQL cannot enforce "only update rows where source = 'user'" automatically, so the Curator code must check before every write.

## CREATE TABLE

```sql
CREATE TABLE skills (
  name            TEXT PRIMARY KEY,   -- flat, lowercase, hyphens only, max 64 chars — the exact string used in skill_view(name)
  user_id         TEXT NOT NULL,      -- owner — self-describing for export and Data Studio
  description     TEXT NOT NULL,      -- one line, max 120 chars — the ONLY part shown in the index
  content         TEXT NOT NULL,      -- full markdown procedure — only loaded on skill_view()
  tags            TEXT NOT NULL DEFAULT '[]', -- JSON array of strings — Curator metadata only, not used in index
  source          TEXT NOT NULL,      -- 'system' | 'user'
  status          TEXT NOT NULL DEFAULT 'active', -- 'active' | 'stale' | 'archived'
  version         INTEGER NOT NULL DEFAULT 1,     -- increments on every skill_update
  use_count       INTEGER NOT NULL DEFAULT 0,     -- increments on every skill_view call
  last_used_at    INTEGER,            -- unix timestamp ms of last skill_view call — NULL until first use
  archived_reason TEXT,               -- reason passed to skill_archive() — NULL if not archived
  created_at      INTEGER NOT NULL,   -- unix timestamp ms — when this skill was first created
  updated_at      INTEGER NOT NULL    -- unix timestamp ms — when this row last changed
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const skills = sqliteTable('skills', {
  name:           text('name').primaryKey(),
  userId:         text('user_id').notNull(),
  description:    text('description').notNull(),     // max 120 chars — Zod enforced
  content:        text('content').notNull(),          // full markdown
  tags:           text('tags').notNull().default('[]'),
  source:         text('source').notNull(),           // 'system' | 'user'
  status:         text('status').notNull().default('active'),
  version:        integer('version').notNull().default(1),
  useCount:       integer('use_count').notNull().default(0),
  lastUsedAt:     integer('last_used_at'),
  archivedReason: text('archived_reason'),
  createdAt:      integer('created_at').notNull(),
  updatedAt:      integer('updated_at').notNull(),
})
```

## Column Decisions

**`name` — primary key, Zod-constrained**
The exact string `skill_view(name)` matches against. Constraint: `/^[a-z][a-z0-9-]*$/`, max 64 chars. Lowercase, hyphens only. Same discipline as `user_memory` namespaces — flat, no dots. Enforced by Zod at `skill_create` boundary. Never changes after creation.

**`user_id` — kept**
Same reason as all other tables. Rows must be self-describing outside the DO.

**`description` — 120 char cap, the index entry**
This is the entire basis on which the model decides to load a skill. It must be specific enough to distinguish this skill from all others, and short enough that 20+ skills in the index don't overwhelm the prompt. Zod enforces `.max(120)`.

**`content` — full markdown, never preloaded**
The actual procedure. Can be long. Only pulled into context when the agent explicitly calls `skill_view(name)`. Token cost is zero until that call happens. No size cap enforced in SQL — but practically, content that exceeds ~4000 tokens becomes a context burden and the Curator should flag it.

**`tags` — JSON array, Curator-only**
Example: `["food", "health", "detection"]`. Used by the Curator to detect overlapping skills (two skills tagged `["allergy", "detection"]` might be consolidation candidates). Never injected into the system prompt index. Never used for skill selection.

**`source` — 'system' or 'user'**
System skills are seeded at DO initialization. User skills are created by the agent at runtime via `skill_create`. The Curator only ever touches user skills. This column is the gate.

**`status` — three states**
- `active`: in the index, visible to the agent
- `stale`: Curator flagged as long-unused, still in index but deprioritized (shown last)
- `archived`: excluded from the index entirely, content preserved in table

**`version` — integer, increments on every skill_update**
Starting at 1. Every call to `skill_update` increments this before archiving the old content to `skill_versions`. Tells the Curator how many times this skill has been rewritten — a high version count with low `use_count` means the skill keeps getting rewritten but never actually used.

**`use_count` — increments on every skill_view call**
The foundation of skill evolution. The index is ordered by `use_count DESC` — most-used skills appear first, reducing how far the model has to scan. Curator uses this for stale detection: low `use_count` + old `last_used_at` = candidate for `stale` status.

**`last_used_at` — nullable**
NULL until the skill is used for the first time. A system skill that has never been used has `last_used_at = NULL` — this is valid and expected for newly seeded skills.

**`archived_reason` — nullable**
NULL for active and stale skills. Set when `skill_archive(name, reason)` is called. The reason is stored here permanently so the Curator and developers know why a skill was archived.

## Zod Schema (Tool Boundary Enforcement)

```typescript
import { z } from 'zod'

const SkillNameSchema = z.string()
  .regex(/^[a-z][a-z0-9-]*$/)
  // allows:  "cooking-coach", "ethiopian-spice-layering", "medication-awareness"
  // rejects: "Cooking Coach" (uppercase), "cooking.coach" (dot), "cooking coach" (space)
  .max(64)

const SkillCreateSchema = z.object({
  name:        SkillNameSchema,
  description: z.string().min(1).max(120),
  content:     z.string().min(1),
  tags:        z.array(z.string()).default([]),
})

const SkillUpdateSchema = z.object({
  name:    SkillNameSchema,
  content: z.string().min(1),
  reason:  z.string().min(1), // reason is required — no silent rewrites
})
```

## System Skills — Seeded at DO Initialization

```
cooking-coach          — Step-by-step voice cooking methodology with intervention logic
allergy-detection      — Behavioral inference workflow for detecting and confirming allergens
illness-detective      — Food history analysis procedure for foodborne illness investigation
recipe-reconstruction  — Multi-speaker session technique for capturing grandma-style recipes
medication-awareness   — Drug-food interaction checking workflow
```

Seeded with `source = 'system'`, `status = 'active'`, `version = 1`. The Curator never touches these. They are updated only in code and reseeded.

## Indexes

```sql
CREATE INDEX idx_skills_status_use    ON skills (status, use_count DESC);
CREATE INDEX idx_skills_source        ON skills (source);
CREATE INDEX idx_skills_last_used     ON skills (last_used_at DESC) WHERE status != 'archived';
```

**Why these indexes:**
- `(status, use_count DESC)` — index injection: load all active skills ordered by most-used first
- `(source)` — Curator gate: `WHERE source = 'user'` to find all skills the Curator is allowed to touch
- `(last_used_at DESC)` partial — stale detection: find non-archived skills with oldest last use

## Write Rules

- `skill_create` — agent only. Inserts a new row. Zod validates name and description before insert. System skills inserted by DO initialization code, not by the agent.
- `skill_update` — agent or Curator. Before overwriting `content`, archives current version to `skill_versions`. Increments `version`. Updates `content`, `description` (if changed), `updated_at`.
- `skill_archive` — agent or Curator. Sets `status = 'archived'`, sets `archived_reason`. Never deletes.
- `skill_delete` — agent only, irreversible. Removes row from `skills`. `skill_versions` rows for this skill are NOT deleted — history survives.
- `skill_view` — increments `use_count` and sets `last_used_at` as a side effect of every read.
- Curator NEVER writes to rows where `source = 'system'`.

## Read Rules

- Index injection: every session prompt includes all `status = 'active'` or `status = 'stale'` skills, ordered by `use_count DESC`, format: `name: description`.
- `skill_view(name)` loads full `content` into context on demand.
- Curator reads all `source = 'user'` skills on its maintenance pass to evaluate stale/archive candidates and detect overlaps via tags.

## What Is NOT Stored Here

- Historical versions of skill content → `skill_versions`
- Declarative user facts → `user_memory`
- Personality traits → `user_personality`
- Raw event history → `memory_event`
