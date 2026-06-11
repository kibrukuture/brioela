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
**FIXED (002 scope closed).** Specs, schema, migrations, and tools aligned:

- `13-view-user-recipe.md` — `status = 'active'`, `getOne()`, `normalizedRecipeContentSchema.safeParse`
- `14-update-user-recipe.md` — version archive transaction, title sync from `content.title`, `createId()` + `replaceUserRecipeContent`
- `15-archive-user-recipe.md` — `archiveUserRecipe` repository, `status = 'archived'`
- `09-recipes.md` — title mirror + version history + origin naming documented
- `09-recipe-versions.md` — archive table spec
- Code — `recipes.version`, `recipe_versions`, `recipes_title_matches_content_check`, migrations `0005_recipe_versions_and_title_sync` and `0006_recipe_origin_naming`
- Tools — split structure (`_schemas`, `_prompts`, `_executables`, `.tool.ts`), wired in `get.brain.tools.ts`
- Tests — `recipe.tool.test.ts` + `recipe.tool.test.schema.helper.ts` (scoped recipe tables, `idFromName()`)
- Ledger — `0005.recipe-tools.md` marked Shipped

**Out of 002 scope (separate work):** Mira session-end recipe create path, share/import job pipeline naming.
