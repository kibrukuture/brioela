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
  title             TEXT NOT NULL,      -- recipe name — not unique, user can have "Doro Wat" and "Grandma's Doro Wat"
  content           TEXT NOT NULL,      -- full markdown: ingredients as written, steps, notes, cultural context
  ingredients       TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings — extracted from content for constraint checking
  source            TEXT NOT NULL,      -- 'session' | 'reconstructed' | 'user_created' — free text, not an enum
  source_session_id TEXT,               -- which session first produced this recipe — NULL for user_created
  cook_time_minutes INTEGER,            -- nullable — used by cooking session for pacing and alarm system for timing warnings
  tags              TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings — cuisine, meal type, occasion, etc.
  cook_count        INTEGER NOT NULL DEFAULT 0,  -- how many cooking sessions have used this recipe
  last_cooked_at    INTEGER,            -- unix timestamp ms — NULL until first cooking session
  active            INTEGER NOT NULL DEFAULT 1,  -- 1 = active, 0 = archived (soft delete)
  created_at        INTEGER NOT NULL,   -- unix timestamp ms
  updated_at        INTEGER NOT NULL    -- unix timestamp ms
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const recipes = sqliteTable('recipes', {
  id:              text('id').primaryKey(),
  userId:          text('user_id').notNull(),
  title:           text('title').notNull(),
  content:         text('content').notNull(),
  ingredients:     text('ingredients').notNull().default('[]'),   // JSON array of strings
  source:          text('source').notNull(),                      // free text — not an enum
  sourceSessionId: text('source_session_id'),
  cookTimeMinutes: integer('cook_time_minutes'),
  tags:            text('tags').notNull().default('[]'),
  cookCount:       integer('cook_count').notNull().default(0),
  lastCookedAt:    integer('last_cooked_at'),
  active:          integer('active').notNull().default(1),
  createdAt:       integer('created_at').notNull(),
  updatedAt:       integer('updated_at').notNull(),
})
```

## Column Decisions

**`id` — UUID**
Sessions reference recipes via `sessions.recipe_id`. Stable cross-table identity needed. UUID is the right key — title is not unique and not stable.

**`title` — not unique**
A user can have "Doro Wat", "Grandma's Doro Wat", "Doro Wat — lighter version". No uniqueness constraint. UUID is the identity.

**`content` — full markdown, no size cap**
Grandma's voice, cultural context, technique notes, exact phrasing — all preserved. A reconstructed grandma recipe can be long. The agent loads this only when needed via `view_user_recipe(id)`, never preloaded into every prompt.

**`ingredients` — JSON array of strings, kept in sync with content**
Exists only for constraint checking. When the agent checks "is this recipe safe for this user," it reads `ingredients` and matches against `constraints`. It does not parse `content` for safety checks — that would be unreliable. Every `update_user_recipe` that changes content must re-extract and update `ingredients` in the same transaction.

**`source` — free text, known values are suggestions**
`session`: captured from a CookingAgent session. `reconstructed`: agent rebuilt from memory_event fragments after the fact. `user_created`: user dictated it directly. New sources added without schema change.

**`source_session_id` — nullable**
Points to the first session that produced this recipe. NULL for user_created. Lets you trace back to the original conversation and re-read the grandma session transcript if needed.

**`cook_time_minutes` — nullable integer**
NULL when grandma does not state a time — never fabricated. When present, the CookingAgent uses it at session start to set expectations ("this will take about 2 hours") and to pace the session. The alarm system uses it to warn the user if starting this recipe conflicts with a scheduled event or upcoming alarm.

**`cook_count` — incremented by cooking sessions**
Every time a cooking session with this `recipe_id` completes successfully, `cook_count` increments. This is the primary signal for recipe relevance — recipes the user actually makes vs recipes they saved and never touched. Fire-and-forget increment, never awaited.

**`last_cooked_at` — nullable**
NULL until first cooking session. Combined with `cook_count = 0`, identifies recipes that were captured but never actually cooked — archiving candidates.

**`active` — soft delete**
0 = archived. Row never deleted. If a recipe is archived and the user asks about it, the agent can surface it and offer to restore it.

## Indexes

```sql
CREATE INDEX idx_recipes_active      ON recipes (active, cook_count DESC);
CREATE INDEX idx_recipes_last_cooked ON recipes (last_cooked_at DESC) WHERE active = 1;
CREATE INDEX idx_recipes_source      ON recipes (source_session_id) WHERE source_session_id IS NOT NULL;
```

**Why these indexes:**
- `(active, cook_count DESC)` — recipe index injection: load all active recipes ordered by most cooked first
- `(last_cooked_at DESC)` partial — stale detection: find active recipes with oldest last use, archiving candidates
- `(source_session_id)` partial — trace: find which recipe came from a given session

## Write Rules

- New row inserted by CookingAgent at session end, only after passing the session-end decision tree. Never inserted automatically without the check.
- `cook_count` and `last_cooked_at` updated at the end of every cooking session that uses this recipe — fire and forget, never awaited.
- `update_user_recipe` — agent rewrites `content`. Must re-extract and update `ingredients` in the same write. `updated_at` always updated.
- `archive_user_recipe` — sets `active = 0`. Never deletes.
- Curator does NOT write to this table. Recipe lifecycle is agent-driven and user-confirmed.

## Read Rules

- Title index injected into every session prompt: `id: title` for all active recipes. Agent calls `view_user_recipe(id)` to load full content on demand.
- Read by constraint checker before a cooking session starts: `ingredients` checked against user's active constraints.
- Read by `sessions` queries: "show me all sessions where we cooked this recipe" via `sessions.recipe_id`.
- Read by the agent when the user asks about past cooking: "when did we last make doro wat."

## What Is NOT Stored Here

- The session transcript that produced this recipe → `session_turns`
- Session metadata → `sessions`
- User food facts and preferences → `user_memory`
- Allergies and dietary restrictions → `constraints`
