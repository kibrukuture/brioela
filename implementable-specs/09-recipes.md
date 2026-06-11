# Table: recipes

## Why This Table Exists

Recipes are a distinct domain from `user_memory` facts and `session_turns` transcripts. A recipe is a reusable, structured artifact — something the user returns to, cooks again, refines over time, shares context about during cooking sessions. It has identity (a title, a source), usage history (cook_count), and content (ingredients, steps, cultural notes).

Storing recipes as `user_memory` entries would collapse a structured reusable artifact into a flat fact store with no usage tracking, no cook history, no constraint checking surface, and no link back to the session that produced it.

## Design Decision: A Cooking Session Does NOT Automatically Produce a New Recipe

This is the most important decision in this file. At the end of a cooking session, the agent does NOT blindly run recipe reconstruction and insert a row. It runs a decision tree first.

### Session-End Decision Tree

```
1. Did this session involve cooking something specific?
   → No (family conversation, food mentioned but no cooking)
   → Skip recipe handling entirely. Note in outcome_summary.

2. Does a recipe for this dish already exist in the user's collection?
   → Check recipes table by title similarity and ingredient overlap
   → Yes — is this session materially different?
       → No (same dish, same technique, minor variation)
       → Increment cook_count on existing recipe. Add session note if notable. Done.
       → Yes (new technique, meaningful substitution, significant variation)
       → Propose updating existing recipe OR creating a named variant. Not automatic.

3. Is the transcript complete enough to reconstruct?
   → Session ended abruptly, grandma left mid-way, dish was never finished
   → Flag as incomplete in outcome_summary. Skip recipe creation.
   → User can manually trigger reconstruction later if they want.

4. Is this genuinely a new recipe with enough signal to capture?
   → Yes → run recipe-reconstruction skill → insert new row
```

The `recipe-reconstruction` system skill runs only at step 4. It is not a default that fires at every cooking session end.

### Edge Cases

**Multi-dish session** — grandma makes two dishes in one session.

The agent reads the full session transcript and uses judgment. If it can confidently identify two distinct dishes (different names, different ingredients, different techniques discussed as separate cooking acts), it creates two recipe rows — one per dish. There is no mechanical transcript segmentation required; the agent reasons from context.

If the transcript is ambiguous (one pot, multiple proteins, unclear if this is one dish or two), the agent creates one row for the primary dish and notes the secondary elements in `outcome_summary`. The rule: confident identification of two named dishes → two rows. Ambiguity → one row plus a note.

**Recipe correction across sessions** — session 2 grandma says "I did it wrong last time, here is the real way."

Not yet resolved. Documented here so it is not forgotten.

**Collaborative variation** — family member adapts grandma's recipe for dietary restrictions.

The original recipe row is never modified or deleted. The adapted recipe is a new row.

The deciding question is: same cook refining their own recipe, or someone else adapting it for a different purpose?

- Same cook, same session, refining their own recipe → `update_user_recipe` on the existing row. The dish is the same dish, the row should stay current.
- Different person, different purpose, or dietary adaptation → new recipe row. The original is preserved untouched. The new row's `content` includes a note: "variant of [original title]". Both rows coexist. A grandmother's original recipe has cultural and historical value — overwriting it with a dietary adaptation would lose it permanently.

Dietary restriction adaptations always fall in the second category. Even if the change is minor (remove one ingredient), the original belongs to grandma. The adapted version belongs to whoever needs it.

**Implicit recipe** — no one explicitly names the dish; agent must infer from ingredients and technique.

Confidence threshold for dish identity inference not yet defined. Documented here so it is not forgotten.

## Design Decision: Hybrid Storage — Markdown Content + Extracted Ingredients

**Problem**: If ingredients are buried in markdown content only, the constraint system cannot programmatically check "does this recipe contain peanuts." It would have to guess from free text — unreliable for safety-critical allergy checking.

**Problem**: If ingredients are forced into rigid structured objects (name, quantity, unit), grandma's recipe loses fidelity. "Enough berbere until it smells right" cannot be expressed as `{ quantity: 2, unit: "tsp" }`.

**Solution**: Two representations of the same truth:
- `content` — full markdown. Ingredients as written (narrative, cultural voice preserved), steps, technique notes, grandma's exact words. What the user reads and the agent loads during cooking.
- `ingredients` — JSON array of strings. Machine-extracted from content. Used only for constraint checking. Example: `["berbere", "niter kibbeh", "chicken", "onions"]`. Not structured objects — just strings. Enough to match against `constraints.entity_value`.

When content is updated, `ingredients` must be re-extracted and updated in the same write.

## Design Decision: No Recipe Versions Table

Unlike skills, recipe edits are user-driven refinements — grandma corrected a step, user found a better technique. A separate versions table is premature. If version history becomes needed, it is a straightforward addition. For now: `updated_at` records the last change, `source_session_id` traces back to the originating session.

## Design Decision: No FTS Virtual Table for Recipes

A user will have at most tens to low hundreds of recipes — never thousands. All recipe titles fit in the agent's context comfortably. Pattern: inject title list into prompt, agent calls `view_user_recipe(id)` to load full content on demand. Same pattern as skills. FTS is not needed at this scale.

## CREATE TABLE

```sql
CREATE TABLE recipes (
  id                TEXT PRIMARY KEY,   -- UUID v4
  user_id           TEXT NOT NULL,      -- owner — self-describing for export
  title             TEXT NOT NULL,      -- recipe name
  source            TEXT NOT NULL,      -- 'cooking_session' | 'url' | 'manual' | 'family_capture'
  source_session_id TEXT,               -- session_id that produced this recipe
  source_url        TEXT,               -- URL if source = 'url'
  content           TEXT NOT NULL,      -- JSON string of NormalizedImportedRecipe
  version           INTEGER NOT NULL DEFAULT 1, -- current version of the recipe
  cook_count        INTEGER NOT NULL DEFAULT 0,
  last_cooked_at    INTEGER,
  status            TEXT NOT NULL DEFAULT 'active', -- 'active' | 'archived' (soft delete)
  confidence        REAL NOT NULL DEFAULT 1.0,
  created_at        INTEGER NOT NULL,   -- unix timestamp ms
  updated_at        INTEGER NOT NULL,   -- unix timestamp ms
  CONSTRAINT "recipes_content_json_object_check" CHECK(json_valid(content) and json_type(content) = 'object'),
  CONSTRAINT "recipes_version_check" CHECK(version >= 1),
  CONSTRAINT "recipes_cook_count_check" CHECK(cook_count >= 0),
  CONSTRAINT "recipes_last_cooked_at_check" CHECK(last_cooked_at is null or last_cooked_at >= 0),
  CONSTRAINT "recipes_status_check" CHECK(status in ('active', 'archived')),
  CONSTRAINT "recipes_confidence_check" CHECK(confidence >= 0 and confidence <= 1),
  CONSTRAINT "recipes_created_at_check" CHECK(created_at >= 0),
  CONSTRAINT "recipes_updated_at_check" CHECK(updated_at >= created_at)
);

CREATE TABLE recipe_versions (
  id            TEXT PRIMARY KEY,   -- UUID v4
  recipe_id     TEXT NOT NULL,      -- references recipes.id logical FK
  user_id       TEXT NOT NULL,
  version       INTEGER NOT NULL,   -- version before incrementing
  content       TEXT NOT NULL,      -- JSON string of NormalizedImportedRecipe before update
  updated_by    TEXT NOT NULL,      -- 'agent' | 'brain_maintenance'
  update_reason TEXT NOT NULL,      -- audit reason for change
  archived_at   INTEGER NOT NULL,   -- unix timestamp ms
  CONSTRAINT "recipe_versions_version_check" CHECK(version >= 1),
  CONSTRAINT "recipe_versions_updated_by_check" CHECK(updated_by in ('agent', 'brain_maintenance')),
  CONSTRAINT "recipe_versions_archived_at_check" CHECK(archived_at >= 0)
);
```

## Drizzle Schema

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const recipes = sqliteTable('recipes', {
  id:              text('id').primaryKey(),
  userId:          text('user_id').notNull(),
  title:           text('title').notNull(),
  source:          text('source').notNull(),
  sourceSessionId: text('source_session_id'),
  sourceUrl:       text('source_url'),
  content:         text('content').notNull(),
  version:         integer('version').notNull().default(1),
  cookCount:       integer('cook_count').notNull().default(0),
  lastCookedAt:    integer('last_cooked_at'),
  status:          text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  confidence:      real('confidence').notNull().default(1.0),
  createdAt:       integer('created_at').notNull(),
  updatedAt:       integer('updated_at').notNull(),
})

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

**`id` — UUID**
Sessions reference recipes via `sessions.recipe_id`. Stable cross-table identity needed. UUID is the right key.

**`title` — not unique**
A user can have "Doro Wat", "Grandma's Doro Wat". No uniqueness constraint. UUID is the identity.

**`content` — JSON string of NormalizedImportedRecipe**
Stores the normalized recipe JSON object including: `title`, `ingredients` (array of objects), `steps` (array of objects), `tags` (array of strings), `cuisine`, `servings`, `totalTimeMinutes`, and `warnings`. The agent loads this on demand via `view_user_recipe(id)`.

**`source` — free text**
`session`: captured from a Mira session. `url`: imported from web url. `manual`: created by user.

**`source_session_id` — nullable**
Points to the session ID that produced this recipe.

**`cook_count` — integer**
Incremented on every successful cook session.

**`last_cooked_at` — nullable integer**
Timestamp of last cook session.

**`status` — soft delete**
'active' | 'archived'. Row never deleted.

## Write Rules

- New row inserted at cooking session end.
- `update_user_recipe` — updates the JSON `content` payload. Must archive the previous version's `content` and metadata to `recipe_versions` table within the same transaction.
- `archive_user_recipe` — sets `status = 'archived'`. Never deletes.

## Read Rules

- Title index injected into session prompts: `id: title`. Agent calls `view_user_recipe(id)` to load full content.
- Read by constraint checker: ingredients array inside JSON `content` checked against user's active constraints.
- Read by sessions: find all sessions for a given `recipe_id`.

## What Is NOT Stored Here

- The session transcript that produced this recipe → `session_turns`
- Session metadata → `sessions`
- User food facts and preferences → `user_memory`
- Allergies and dietary restrictions → `constraints`
