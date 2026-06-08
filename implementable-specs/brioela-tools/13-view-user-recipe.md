# Tool: view_user_recipe

## Purpose

`view_user_recipe` loads a recipe's full content into the agent's context on demand. The recipe index (id + title for every active recipe) is injected into every session prompt. The agent reads the index, identifies the relevant recipe, and calls `view_user_recipe` to load the full markdown content only when it actually needs it — for a cooking session, for answering a question about ingredients, for constraint checking before recommending.

Full recipe content is never preloaded into every prompt. Token cost is zero until this tool is called.

## When to Call It

Call `view_user_recipe` when:
- The agent is starting a cooking session and needs the full recipe to guide it
- The user asks about a specific recipe: "how do we make that doro wat?"
- The agent needs to check ingredients against the user's active constraints before recommending
- The agent is evaluating whether to update a recipe vs create a new one (needs to read existing content first)

Do NOT call `view_user_recipe` when:
- The recipe was already loaded earlier in this session — the content is already in context
- The agent just wants to know if a recipe exists — the index already shows all active recipes by title
- The agent is browsing all recipes out of curiosity — load only what is actually needed

## Input Schema

```typescript
import { z } from 'zod'

export const ViewUserRecipeSchema = z.object({
  id: z.string().uuid(),
  // The recipe UUID from the index injected into the session prompt.
  // Must be the exact UUID — no fuzzy matching, no title lookup.
  // If the agent only has a title and needs the ID, it reads the injected index.
})
```

## What It Reads

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
```

Only active recipes (`active = 1`) are returned. Archived recipes (`active = 0`) return `found: false`. The agent should not attempt to load archived recipes — they are excluded from the index and the agent should not know their IDs.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "title": "Grandma's Doro Wat",
  "content": "# Grandma's Doro Wat\n\n## Ingredients\n...",
  "ingredients": ["chicken", "berbere", "niter kibbeh", "onions", "eggs"],
  "source": "session",
  "source_session_id": "b2c3d4e5-...",
  "cook_time_minutes": 120,
  "cook_count": 4,
  "last_cooked_at": 1748390400000,
  "tags": ["ethiopian", "poultry", "special-occasion"]
}
```

`ingredients` is the machine-extracted list — useful for immediate constraint checking without parsing the full content. The agent should check this against the user's active constraints before beginning a cooking session or recommending the recipe.

**Recipe not found or archived:**

```json
{
  "found": false,
  "id": "a1b2c3d4-...",
  "hint": "Recipe not found or archived. Check the recipe index for available recipes."
}
```

Not an error. The agent should check the index and re-evaluate.

## Constraint Check Pattern

After loading a recipe, the agent should immediately cross-check the `ingredients` array against the user's active constraints. This check is agent-side logic, not a side effect of this tool:

```
1. view_user_recipe(id) → ingredients: ["chicken", "berbere", "niter kibbeh", "eggs"]
2. Check user's active constraints (already in session context)
3. If hard_allergy or confirmed intolerance matches → warn user before proceeding
4. If proposed constraint matches → surface for confirmation before proceeding
5. If dislike matches → deprioritize or note, do not block
```

The tool returns `ingredients` so this check can happen inline. The agent does not need a second database read.

## Side Effects

None. `cook_count` and `last_cooked_at` are NOT incremented by viewing a recipe. These counters track actual cooking sessions, not views. They are updated at the end of a cooking session that used this recipe — fire-and-forget, never via this tool.

There is no `view_count` on recipes. The recipe index injection + `view_user_recipe` pattern is the access model. If recipe access frequency becomes important, it is a future addition — the spec does not require it now.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not a valid UUID | Zod error with failing field |
| Not found or archived | No active row with this ID | `{ found: false, id, hint }` |
| Read failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session
- **NOT the Curator** — the Curator reads recipe content directly in its maintenance pass (if it ever needs to), not through tools. Currently the Curator spec does not require recipe reads.
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Creating a new recipe → the MiraSession inserts directly via the recipe-reconstruction skill, no separate tool exposed
- Updating a recipe's content → `update_user_recipe`
- Archiving a recipe → `archive_user_recipe`
- Listing all recipes → recipe index is injected into every session prompt automatically
- Loading archived recipes → not exposed; developer-only
