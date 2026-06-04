# Table: skill_versions

## Why This Table Exists

Every time `update_user_skill` is called, the current skill content is overwritten. Without history, a bad Curator pass or a poorly-reasoned agent update permanently destroys a skill that took months of real sessions to build. There is no undo.

`skill_versions` is the undo. Before every overwrite, the old content is archived here as a row. The `skills` table always has the current state. This table has every previous state — full content, the description at that version, who made the change, and why.

## Decision: this is a developer safety net, not an agent tool

The agent has no `restore_skill_version` tool. Rollback is a developer-only action. Reason: if the agent could roll back its own skills mid-conversation, it could create instability loops — a bad session triggers a rewrite, the rewrite performs worse, the agent rolls back, the same session triggers another rewrite. The agent writes forward only. Humans roll back.

## Decision: no hard foreign key to skills.name

`skill_versions.skill_name` references `skills.name` logically but not with a hard SQL foreign key constraint. Reason: `delete_user_skill` permanently removes a row from `skills`. If a hard foreign key with CASCADE DELETE existed, deleting a skill would cascade-delete all its version history — destroying the only record of what the skill contained. Without the hard constraint, version history survives skill deletion. The relationship is preserved logically; the data is preserved physically.

## Decision: store both content AND description per version

Description can change between `update_user_skill` calls — the agent may refine the one-line description along with the content. If only `content` is archived, the old description is lost. Both must be stored per version to make the history complete and rollback-safe.

## CREATE TABLE

```sql
CREATE TABLE skill_versions (
  id            TEXT PRIMARY KEY,   -- UUID v4
  skill_name    TEXT NOT NULL,      -- which skill this version belongs to — plain text, no hard FK
  user_id       TEXT NOT NULL,      -- owner — self-describing for export and Data Studio
  version       INTEGER NOT NULL,   -- the version number at the time this was archived (matches skills.version before the update)
  content       TEXT NOT NULL,      -- full markdown content of this version
  description   TEXT NOT NULL,      -- description at this version — may differ from current
  updated_by    TEXT NOT NULL,      -- 'agent' | 'curator' — who triggered the update_user_skill that replaced this version
  update_reason TEXT NOT NULL,      -- reason string passed to update_user_skill(name, content, reason) — required, never empty
  archived_at   INTEGER NOT NULL    -- unix timestamp ms — when this version was replaced by the next one
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const skillVersions = sqliteTable('skill_versions', {
  id:           text('id').primaryKey(),
  skillName:    text('skill_name').notNull(),    // logical reference to skills.name, no hard FK
  userId:       text('user_id').notNull(),
  version:      integer('version').notNull(),
  content:      text('content').notNull(),
  description:  text('description').notNull(),
  updatedBy:    text('updated_by').notNull(),    // 'agent' | 'curator'
  updateReason: text('update_reason').notNull(),
  archivedAt:   integer('archived_at').notNull(),
})
```

## Column Decisions

**`id` — UUID**
No natural key exists for a historical version. UUID is the only option.

**`skill_name` — plain text, no hard FK**
Logical reference to the skill. Hard FK with CASCADE DELETE would destroy history when a skill is deleted. Plain text preserves history unconditionally.

**`user_id` — kept**
Same reason as all other tables. Rows must be self-describing outside the DO.

**`version` — integer matching skills.version before the update**
When `update_user_skill` fires: the current `skills.version` (e.g. 3) is written here, then `skills.version` is incremented to 4. This means `skill_versions` row with `version = 3` holds what the skill looked like at version 3, and `skills` now holds version 4. The version numbers are continuous and auditable.

**`content` — full markdown of the old version**
The complete previous content. Nothing truncated. This is the rollback material.

**`description` — description at this version**
Archived alongside content because description can change between updates. A complete history requires both.

**`updated_by` — 'agent' or 'curator'**
Tells you who decided to rewrite the skill. An agent rewrite means the agent found a better approach mid-conversation. A Curator rewrite means the scheduled maintenance pass made a consolidation or improvement decision. Different accountability.

**`update_reason` — required, never empty**
The reason string from `update_user_skill(name, content, reason)`. Zod enforces `.min(1)` on reason in the `SkillUpdateSchema` — no silent rewrites allowed. The reason is permanently stored here so future developers and the Curator know why each version was replaced.

**`archived_at` — when this version was replaced**
The timestamp of the `update_user_skill` call that replaced this version. Combined with `version`, gives a complete timeline of when each rewrite happened.

## Indexes

```sql
CREATE INDEX idx_skill_versions_skill   ON skill_versions (skill_name, version DESC);
CREATE INDEX idx_skill_versions_user    ON skill_versions (user_id);
```

**Why these indexes:**
- `(skill_name, version DESC)` — primary access pattern: "show me all versions of cooking-coach, newest first" — used for developer inspection and rollback
- `(user_id)` — data export: find all version history belonging to this user

## Write Rules

- Written ONLY by the `update_user_skill` execution path — never written directly by any other code.
- One row inserted per `update_user_skill` call, before the content is overwritten in `skills`.
- `archived_at` is always `Date.now()` at write time, set by the system, never passed in.
- `id` is always `crypto.randomUUID()`, generated at insert time.
- Never updated after insert. Never deleted (even when the parent skill is deleted).

## Read Rules

- Read by developers for inspection and rollback via Cloudflare Data Studio or admin tooling.
- Never read by the agent during normal operation.
- Never injected into any prompt.
- The Curator may read this table to understand how many times a skill has been rewritten and why — but it does not use it to make automated decisions.

## What Is NOT Stored Here

- Current skill state → `skills`
- User facts → `user_memory`
- Personality traits → `user_personality`
- Raw events → `memory_event`
