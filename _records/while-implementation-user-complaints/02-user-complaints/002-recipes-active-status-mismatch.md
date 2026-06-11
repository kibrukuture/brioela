# 002 — `recipes` Active Flag Mismatch

## Complaint
The recipe specs (such as `14-update-user-recipe.md` and `15-archive-user-recipe.md`) refer to an `active` column (expected to be a boolean/integer `0` or `1` indicating soft deletion status).

However, the actual database schema in `backend/src/agents/brain/_schemas/recipe.schema.ts` implements a string `status` column:
```typescript
const recipeStatus = ['active', 'archived'] as const
// ...
status: text('status', { enum: recipeStatus }).notNull().default('active'),
```
There is no `active` column in the Drizzle schema.

## What Needs to Happen
We must decide whether to:
1. Update the specs and tools to query/modify `status` (`'active'` or `'archived'`) instead of `active` (`1` or `0`).
2. Or update the Drizzle schema `recipe.schema.ts` to replace/add the `active` integer column.

## Why
Writing or querying `recipes.active` will fail both at compilation and during runtime query execution since the database schema has a `status` text column.

## Status
**FIXED (narrow scope).** Updated `13-view-user-recipe.md` to query `status = 'active'` instead of non-existent `active = 1`, use `getOne()`, and document that ingredients/tags/steps live inside `content` JSON with `ingredient_names` derived at read time.

**Still open (separate slices):** `recipes.version` + `recipe_versions` table in code; `09-recipes.md` internal contradictions; `14-update-user-recipe.md` self-contradictions.
