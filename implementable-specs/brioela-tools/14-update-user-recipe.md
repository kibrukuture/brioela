# Tool: update_user_recipe

## Purpose

`update_user_recipe` rewrites a recipe's `content` and synchronously re-extracts the `ingredients` list from the new content. These two writes happen in a single transaction — they must always be in sync. A recipe where `content` has new ingredients but `ingredients` still has old values is a constraint-checking liability: the allergy system would miss the new ingredient.

Unlike `update_user_skill`, recipes have no version history table. Recipe edits are user-confirmed refinements — grandma corrected a step, user found a better spice ratio, the technique was improved from a recent cooking session. The edit is authoritative. The old content is gone. If version history becomes necessary, it is a future addition.

## When to Call It

Call `update_user_recipe` when:
- A cooking session produced a refinement to an existing recipe — technique corrected, ingredient updated, notes added
- The user explicitly dictates a change: "update the doro wat, grandma said to add more berbere"
- The agent determined this session's approach was a meaningful improvement over the captured recipe (step 2 of the session-end decision tree: Yes, materially different)

Do NOT call `update_user_recipe` when:
- This session produced a genuinely different dish → create a new recipe row (via recipe-reconstruction skill, no tool)
- The recipe is archived (`active = 0`) — unarchive first if the user wants to restore and update
- The update is trivial and not worth overwriting (agent judgment: minor variation vs meaningful refinement)

## Input Schema

```typescript
import { z } from 'zod'

export const UpdateUserRecipeSchema = z.object({
  id: z.string().uuid(),
  // The recipe UUID to update. Must be active (active = 1).

  content: z.string().min(1),
  // The full new markdown content. Replaces the current content entirely.
  // Must include all ingredients, steps, and notes — not a patch.
  // The ingredients list is re-extracted from this content after the write.

  ingredients: z.array(z.string().min(1)).min(1),
  // Machine-extracted ingredient strings from the new content.
  // The agent extracts these before calling this tool — they are not auto-extracted server-side.
  // Why: the agent doing the cooking session has the context to extract accurately.
  //   A generic extractor would miss: "niter kibbeh" as one ingredient vs "butter" as a substitute.
  // Must be non-empty — a recipe with no extractable ingredients is a reconstruction failure.
  // Format: lowercase, individual ingredient name only — no quantities, no units.
  // Good: ["berbere", "niter kibbeh", "chicken", "onions", "eggs"]
  // Bad:  ["2 lbs chicken thighs", "enough berbere"]  ← quantities belong in content, not here

  cook_time_minutes: z.number().int().positive().optional(),
  // Update cook time if changed. Omit to keep existing value.
  // Pass null explicitly to clear it if grandma's new version has no stated time.
  // This field is nullable in the schema — do not pass 0, pass null to clear.

  tags: z.array(z.string()).optional(),
  // Update tags if changed. Omit to keep existing tags.

  reason: z.string().min(1),
  // Why this recipe is being updated. Required.
  // Examples:
  //   "Cooking session with grandma — she corrected the spice order and timing"
  //   "User said to add the egg-marbling step she noticed from last session"
  //   "Session 3 produced a refined technique — updating to capture it"
})
```

## Pre-Update Guards

```typescript
const recipe = db.select()
  .from(recipes)
  .where(
    and(
      eq(recipes.id, input.id),
      eq(recipes.active, 1)
    )
  )
  .get()

if (!recipe) {
  return {
    error: 'recipe_not_found_or_archived',
    id: input.id,
    hint: 'Recipe not found or archived. Only active recipes can be updated.'
  }
}
```

## What It Writes — One Transaction

`content` and `ingredients` must always be in sync. Single transaction:

```typescript
db.transaction(() => {
  db.update(recipes)
    .set({
      content:         input.content,
      ingredients:     JSON.stringify(input.ingredients),
      cookTimeMinutes: input.cook_time_minutes !== undefined
                         ? input.cook_time_minutes
                         : recipe.cookTimeMinutes,
      tags:            input.tags ? JSON.stringify(input.tags) : recipe.tags,
      updatedAt:       Date.now(),
    })
    .where(eq(recipes.id, input.id))
    .run()
})
```

If the transaction fails, both content and ingredients stay unchanged. No partial state.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "title": "Grandma's Doro Wat",
  "ingredients_count": 6,
  "status": "updated"
}
```

`ingredients_count` lets the agent confirm that the extracted ingredients list was non-empty and written.

## Side Effects

None beyond the two column updates. No alarm triggered. No version snapshot created. The updated recipe takes effect immediately — the agent in the current session now has the new content if it calls `view_user_recipe` again (though the content is already in context from the update call's input).

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not UUID, content empty, ingredients empty, cook_time_minutes is 0 or negative | Zod error with failing field |
| Not found or archived | No active row with this ID | `{ error: 'recipe_not_found_or_archived', id, hint }` |
| Transaction failure | SQLite error on write | Error — content and ingredients both unchanged |

## Who Can Call It

- **Agent** — during any active session, after passing the session-end decision tree
- **NOT the Curator** — Curator does not write to recipes
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Creating a new recipe → recipe-reconstruction skill (inserts directly, no separate tool)
- Archiving a recipe → `archive_user_recipe`
- Restoring an archived recipe → developer action, no tool exposed
- Incrementing cook_count → fire-and-forget at cooking session end, not through this tool
