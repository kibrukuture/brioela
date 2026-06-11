# Tool: view_user_recipe

## Purpose

`view_user_recipe` loads a recipe's full content into the agent's context on demand. The recipe index (id + title for every active recipe) is injected into every session prompt. The agent reads the index, identifies the relevant recipe, and calls `view_user_recipe` to load the parsed `NormalizedRecipeContent` JSON only when it actually needs it — for a cooking session, for answering a question about ingredients, for constraint checking before recommending.

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
  id: z.uuid(),
  // The recipe UUID from the index injected into the session prompt.
  // Must be the exact UUID — no fuzzy matching, no title lookup.
  // If the agent only has a title and needs the ID, it reads the injected index.
})
```

## What It Reads

```typescript
import { and, eq, getOne } from '@/database/drizzle/_database'
import { recipes } from '@/agents/brain/_schemas'

const recipe = getOne(
  db.select()
    .from(recipes)
    .where(
      and(
        eq(recipes.id, input.id),
        eq(recipes.status, 'active'),
      ),
    ),
)
```

Only active recipes (`status = 'active'`) are returned. Archived recipes (`status = 'archived'`) return `found: false`. The agent should not attempt to load archived recipes — they are excluded from the index and the agent should not know their IDs.

The row's `content` column is a JSON string (`NormalizedRecipeContent`). Ingredients, steps, tags, and timing live **inside that JSON** — not as separate SQLite columns.

## What It Returns

On success, parse `recipe.content` and derive ingredient names for constraint checking:

```typescript
import { normalizedRecipeContentSchema, deriveIngredientNames } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

const validatedContent = normalizedRecipeContentSchema.safeParse(JSON.parse(recipe.content))
if (!validatedContent.success) {
  return { found: false, id: input.id, hint: 'Recipe content failed validation.' }
}
const content = validatedContent.data
const ingredientNames = deriveIngredientNames(content)
```

```json
{
  "found": true,
  "id": "a1b2c3d4-...",
  "title": "Grandma's Doro Wat",
  "origin": "cooking_session",
  "session_id": "b2c3d4e5-...",
  "link_url": null,
  "cook_count": 4,
  "last_cooked_at": 1748390400000,
  "status": "active",
  "confidence": 1.0,
  "version": 1,
  "content": {
    "title": "Grandma's Doro Wat",
    "ingredients": [{ "name": "chicken", "quantityText": "1 whole", "unit": null, "preparation": null, "optional": false, "estimated": false, "confidence": 1.0 }],
    "steps": [{ "order": 1, "instruction": "...", "durationMinutes": null, "temperatureText": null, "confidence": 1.0 }],
    "tags": ["ethiopian", "poultry", "special-occasion"],
    "totalTimeMinutes": { "value": 120, "confidence": 0.9 },
    "cuisine": "ethiopian",
    "warnings": []
  },
  "ingredient_names": ["chicken", "berbere", "niter kibbeh", "onions", "eggs"]
}
```

- **`content`** — parsed `NormalizedRecipeContent` object from the row's JSON column (see `build-guide/19-recipe-ingestion/04-recipe-normalization.md`).
- **`ingredient_names`** — derived at read time from `content.ingredients[].name` for constraint checking. Not stored as a separate column.

Table metadata (`title`, `origin`, `session_id`, `link_url`, `cook_count`, etc.) comes from the `recipes` row. Cookable body fields (`ingredients`, `steps`, `tags`, `totalTimeMinutes`, …) come from `content` only.

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

After loading a recipe, the agent should immediately cross-check `ingredient_names` against the user's active constraints. This check is agent-side logic, not a side effect of this tool:

```
1. view_user_recipe(id) → ingredient_names from content.ingredients[].name
2. Check user's active constraints (already in session context)
3. If hard_allergy or confirmed intolerance matches → warn user before proceeding
4. If proposed constraint matches → surface for confirmation before proceeding
5. If dislike matches → deprioritize or note, do not block
```

The tool returns `ingredient_names` so this check can happen inline. The agent does not need a second database read.

## Side Effects

None. `cook_count` and `last_cooked_at` are NOT incremented by viewing a recipe. These counters track actual cooking sessions, not views. They are updated at the end of a cooking session that used this recipe — fire-and-forget, never via this tool.

There is no `view_count` on recipes. The recipe index injection + `view_user_recipe` pattern is the access model. If recipe access frequency becomes important, it is a future addition — the spec does not require it now.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not a valid UUID | Zod error with failing field |
| Not found or archived | No row with this ID where `status = 'active'` | `{ found: false, id, hint }` |
| Read failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session
- **NOT the Brain maintenance** — the Brain maintenance reads recipe content directly in its maintenance pass (if it ever needs to), not through tools. Currently the Brain maintenance spec does not require recipe reads.
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Creating a new recipe → the MiraSession writes directly via the recipe-reconstruction skill, no separate tool exposed
- Updating a recipe's content → `update_user_recipe`
- Archiving a recipe → `archive_user_recipe`
- Listing all recipes → recipe index is injected into every session prompt automatically
- Loading archived recipes → not exposed; developer-only
