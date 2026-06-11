# Tool: update_user_recipe

## Purpose

`update_user_recipe` replaces a recipe's `content` JSON and syncs `recipes.title` from `parsed(content).title`. Before overwrite, the current content is archived to `recipe_versions` and `recipes.version` increments — same atomic pattern as `update_user_skill`.

Recipe edits are user-confirmed refinements — grandma corrected a step, user found a better spice ratio, technique improved from a recent cooking session. The live row is authoritative; old content is preserved in `recipe_versions` for developer rollback only.

## When to Call It

Call `update_user_recipe` when:
- A cooking session produced a refinement to an existing recipe — technique corrected, ingredient updated, notes added
- The user explicitly dictates a change: "update the doro wat, grandma said to add more berbere"
- The agent determined this session's approach was a meaningful improvement over the captured recipe (step 2 of the session-end decision tree: Yes, materially different)

Do NOT call `update_user_recipe` when:
- This session produced a genuinely different dish → create a new recipe row (via recipe-reconstruction skill, no tool)
- The recipe is archived (`status = 'archived'`) — unarchive first if the user wants to restore and update
- The update is trivial and not worth overwriting (agent judgment: minor variation vs meaningful refinement)

## Input Schema

```typescript
import { z } from 'zod'
import { normalizedRecipeContentSchema } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

export const UpdateUserRecipeSchema = z.object({
  id: z.uuid(),

  content: z.string().min(1),
  // JSON string — validated with normalizedRecipeContentSchema.safeParse in the executable

  reason: z.string().min(1),

  updated_by: z.enum(['agent', 'brain_maintenance']),
})
```

## Pre-Update Guards

```typescript
import { and, eq, getOne } from '@/database/drizzle/_database'

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

if (!recipe) {
  return {
    error: 'recipe_not_found_or_archived',
    id: input.id,
    hint: 'Recipe not found or archived. Only active recipes can be updated.',
  }
}

// Validate before write:
const validatedContent = normalizedRecipeContentSchema.safeParse(JSON.parse(input.content))
if (!validatedContent.success) {
  return { error: 'invalid_content', id: input.id, hint: '...' }
}
const content = validatedContent.data
```

## What It Writes — Two Tables, One Transaction

```typescript
db.transaction(() => {
  // Step 1: Archive current version to recipe_versions
  db.insert(recipeVersions).values({
    id:           crypto.randomUUID(),
    recipeId:     recipe.id,
    userId:       ctx.userId,
    version:      recipe.version,
    content:      recipe.content,
    updatedBy:    input.updated_by,
    updateReason: input.reason,
    archivedAt:   Date.now(),
  })

  // Step 2: Update the live recipe row
  db.update(recipes)
    .set({
      content:   input.content,
      title:     content.title,
      version:   recipe.version + 1,
      updatedAt: Date.now(),
    })
    .where(eq(recipes.id, input.id))
    .run()
})
```

If either step fails, the transaction rolls back. No partial state.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "title": "Grandma's Doro Wat",
  "previous_version": 2,
  "new_version": 3,
  "archived": true,
  "status": "updated"
}
```

## Side Effects

One `recipe_versions` archive row inserted. The updated recipe is live immediately — the agent in the current session already has the new content from the update input. No alarm triggered. `cook_count` unchanged.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not UUID, content empty, content fails NormalizedRecipeContent parse | Zod error with failing field |
| Not found or archived | No active row with this ID | `{ error: 'recipe_not_found_or_archived', id, hint }` |
| Title sync failure | `parsed(content).title` does not match after write (should not happen if transaction succeeds) | Transaction failure — row unchanged |
| Transaction failure | SQLite error on write | Error — recipe unchanged, no archive row |

## Who Can Call It

- **Agent** — during any active session, after passing the session-end decision tree
- **NOT the Brain maintenance** — Brain maintenance does not write to recipes
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Creating a new recipe → recipe-reconstruction skill (inserts directly, no separate tool)
- Archiving a recipe → `archive_user_recipe`
- Restoring an archived recipe or old version → developer action, no tool exposed
- Incrementing cook_count → fire-and-forget at cooking session end, not through this tool
