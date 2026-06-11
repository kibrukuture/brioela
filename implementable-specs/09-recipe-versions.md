# Table: recipe_versions

## Why This Table Exists

Every time `update_user_recipe` is called, the current recipe content is overwritten. Without history, a bad agent update or Brain maintenance pass permanently destroys a recipe that took real sessions to refine. There is no undo.

`recipe_versions` is the undo. Before every overwrite, the old `content` JSON is archived here as a row. The `recipes` table always has the current state. This table has every previous state — full `NormalizedRecipeContent` JSON, who made the change, and why.

## Decision: developer safety net, not an agent tool

The agent has no `restore_recipe_version` tool. Rollback is developer-only. Same reasoning as `skill_versions` — the agent writes forward only. Humans roll back.

## Decision: no hard foreign key to recipes.id

`recipe_versions.recipe_id` references `recipes.id` logically but not with a hard SQL foreign key. Reason: if a hard FK with CASCADE DELETE existed, deleting a recipe would destroy version history. Plain text `recipe_id` preserves history even if the parent row is removed in a future developer action.

## Decision: archive content only — title lives inside JSON

Unlike skills (which archive both `content` and `description` as separate columns), recipe archives store one `content` JSON blob. That JSON includes `title`. The live `recipes.title` column mirrors `content.title` on the current row; archived title is recoverable from `recipe_versions.content`.

## CREATE TABLE

```sql
CREATE TABLE recipe_versions (
  id            TEXT PRIMARY KEY,   -- UUID v4
  recipe_id     TEXT NOT NULL,      -- which recipe this version belongs to — plain text, no hard FK
  user_id       TEXT NOT NULL,      -- owner — self-describing for export
  version       INTEGER NOT NULL,   -- version number at archive time (matches recipes.version before increment)
  content       TEXT NOT NULL,      -- full NormalizedRecipeContent JSON before overwrite
  updated_by    TEXT NOT NULL,      -- 'agent' | 'brain_maintenance'
  update_reason TEXT NOT NULL,      -- reason from update_user_recipe — required, never empty
  archived_at   INTEGER NOT NULL    -- unix timestamp ms — when this version was replaced
);
```

## Drizzle Schema

```typescript
import { check, index, integer, sql, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const recipeVersions = sqliteTable('recipe_versions', {
  id:           text('id').primaryKey(),
  recipeId:     text('recipe_id').notNull(),
  userId:       text('user_id').notNull(),
  version:      integer('version').notNull(),
  content:      text('content').notNull(),
  updatedBy:    text('updated_by').notNull(),
  updateReason: text('update_reason').notNull(),
  archivedAt:   integer('archived_at').notNull(),
}, (table) => [
  check('recipe_versions_version_check', sql`${table.version} >= 1`),
  check('recipe_versions_updated_by_check', sql`${table.updatedBy} in ('agent', 'brain_maintenance')`),
  check('recipe_versions_archived_at_check', sql`${table.archivedAt} >= 0`),
  index('recipe_versions_recipe_id_version_index').on(table.recipeId, table.version),
])
```

## Column Decisions

**`version` — integer matching recipes.version before the update**
When `update_user_recipe` fires: current `recipes.version` (e.g. 3) is written here, then `recipes.version` becomes 4.

**`content` — full NormalizedRecipeContent JSON of the old version**
Complete previous body including `title`, `ingredients`, `steps`, etc. Nothing truncated. Rollback material.

**`updated_by` / `update_reason` / `archived_at`**
Same accountability model as `skill_versions`.

## Indexes

```sql
CREATE INDEX idx_recipe_versions ON recipe_versions (recipe_id, version DESC);
```

## Write Rules

- Written ONLY by the `update_user_recipe` execution path.
- One row inserted per update, before `recipes.content` is overwritten.
- Never updated after insert. Never deleted.

## Read Rules

- Developer inspection and rollback only.
- Never read by the agent during normal operation.
- Never injected into prompts.

## What Is NOT Stored Here

- Current recipe state → `recipes`
- Usage counters (`cook_count`, `last_cooked_at`) → `recipes` only
- Session transcript → `session_turns`
