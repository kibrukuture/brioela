# Production snapshot: recipe.origin.schema.ts

Target: `backend/src/agents/brain/_schemas/recipe.origin.schema.ts`

**Owner:** **08**; **25** sets `origin = share_import` and optional `read_via` / `shared_from` on import.

```typescript
import { z } from '@brioela/shared/zod'

/**
 * Allowed values for recipe entry fields (`origin`, `read_via`, `shared_from`).
 * Spec: build-guide/19-recipe-ingestion/04-recipe-normalization.md
 */

/** How the recipe entered the user's library (`recipes.origin`). */
export const recipeOriginValues = [
	'cooking_session',
	'family_capture',
	'user_written',
	'share_import',
] as const

export const recipeOriginSchema = z.enum(recipeOriginValues)

export type RecipeOrigin = z.infer<typeof recipeOriginSchema>

/** How import pipeline extracted recipe text (`content.read_via`). Share imports only. */
export const recipeReadViaValues = ['video', 'photo', 'webpage'] as const

export const recipeReadViaSchema = z.enum(recipeReadViaValues)

export type RecipeReadVia = z.infer<typeof recipeReadViaSchema>

/** Platform the user shared from (`content.shared_from`). Share imports only. */
export const recipeSharedFromValues = [
	'tiktok',
	'youtube',
	'instagram',
	'browser',
	'unknown',
] as const

export const recipeSharedFromSchema = z.enum(recipeSharedFromValues)

export type RecipeSharedFrom = z.infer<typeof recipeSharedFromSchema>
```
