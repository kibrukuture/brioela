# Tool: archive_user_recipe

## Purpose

`archive_user_recipe` sets a recipe's `status` flag to `'archived'`, removing it from the active index and from constraint checking. The row is never deleted — content, ingredients, cook history, and source session reference all survive in the table permanently.

An archived recipe can be surfaced to the user on request: "you have an archived recipe for X — want to bring it back?" Restoration is a developer action (set `status = 'active'` directly) — no tool exposed.

## When to Call It

Call `archive_user_recipe` when:
- The user explicitly says "remove it", "we don't make that anymore", "archive the doro wat variant"
- The recipe was captured but never cooked (`cook_count = 0`, `last_cooked_at = NULL`) and the user confirms it is not needed
- Two recipe rows are essentially the same dish — the agent archives the older/less-refined one in favor of the current canonical version

Do NOT call `archive_user_recipe` when:
- The recipe just needs content changes → `update_user_recipe`
- The recipe has been recently cooked — even if the user doesn't plan to cook it again, archive only on explicit request
- The recipe is already archived (`status = 'archived'`) — no-op, return early

## Input Schema

```typescript
import { z } from 'zod'

export const ArchiveUserRecipeSchema = z.object({
  id: z.uuid(),
  // The recipe UUID to archive. Must be active (status = 'active').

  reason: z.string().min(1),
  // Why this recipe is being archived. Required.
  // Stored in a dedicated reason field? No — stored in the session's outcome_summary.
  // The agent records this action and the reason in the outcome_summary of the current session.
  // The recipe row itself has no archived_reason column — the action is traceable through
  // session history, not through a field on the recipe row.
})
```

## Pre-Archive Guards

```typescript
const recipe = db.select()
  .from(recipes)
  .where(eq(recipes.id, input.id))
  .get()

if (!recipe) {
  return { error: 'recipe_not_found', id: input.id }
}

if (recipe.status === 'archived') {
  return {
    error: 'already_archived',
    id: input.id,
    title: recipe.title,
    hint: 'Recipe is already archived.'
  }
}
```

## What It Writes

One update to `recipes`:

```typescript
db.update(recipes)
  .set({
    status:    'archived',
    updatedAt: Date.now(),
  })
  .where(eq(recipes.id, input.id))
  .run()
```

No `archived_reason` column exists on the `recipes` table. The reason is meaningful at the session level — the agent writes it into `outcome_summary` at session end ("Archived doro-wat-variant recipe — user confirmed it was superseded by grandma's Doro Wat"). Tracing why a recipe was archived means reading the session that archived it.

This is a deliberate simplicity decision: recipe archiving is low-frequency and user-confirmed. A dedicated `archived_reason` column adds schema weight for marginal auditability benefit. Session history is the audit trail.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "title": "Doro Wat — lighter version",
  "status": "archived",
  "cook_count": 2,
  "last_cooked_at": 1748390400000
}
```

`cook_count` and `last_cooked_at` are returned so the agent can include meaningful context in the session outcome_summary: "archived lighter doro wat variant, was cooked 2 times, last cooked 3 months ago."

## Effect on the Recipe Index

The recipe disappears from the active index at the next session start. Within the current session, the agent knows it is archived because it just archived it. No mid-session prompt refresh needed.

The recipe's `ingredients` array is no longer checked by the constraint system. If this recipe's ingredient matched a proposed constraint, that proposed constraint still stands — archiving a recipe does not affect constraints.

## Side Effects

None. No alarm triggered. No version snapshot. The `ingredients` list is preserved in the archived row — if the recipe is restored in the future, constraint checking resumes automatically from the preserved data.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not UUID, reason empty | Zod error with failing field |
| Not found | No row with this ID | `{ error: 'recipe_not_found', id }` |
| Already archived | status is already 'archived' | `{ error: 'already_archived', id, title, hint }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, on explicit user request or clear obsolescence signal
- **NOT the Brain maintenance** — Brain maintenance does not write to recipes
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Updating content → `update_user_recipe`
- Permanently deleting a recipe → never exposed; rows are permanent
- Restoring an archived recipe → developer action only (set status = 'active' directly)
- Removing a recipe from constraint checking for a single session → not possible; archiving is the only path
