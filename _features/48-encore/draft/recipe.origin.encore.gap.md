# Draft: recipe.origin.schema.ts — add `encore` (gap — value missing in production)

Target: `backend/src/agents/brain/_schemas/recipe.origin.schema.ts`

**Gap (feature 48):** Spec **44** prose says `source_type = 'encore'`; shipped schema uses `recipes.origin` without `encore`.

**Resolution:** Add `'encore'` to `recipeOriginValues`. No separate `source_type` column.

**Source:** `brioela-specs/44-encore.md`, `_features/08-brain-recipe-tools/spec.md`

---

```typescript
import { z } from '@brioela/shared/zod'

/** How the recipe entered the user's library (`recipes.origin`). */
export const recipeOriginValues = [
	'cooking_session',
	'family_capture',
	'user_written',
	'share_import',
	'encore',
] as const

export const recipeOriginSchema = z.enum(recipeOriginValues)

export type RecipeOrigin = z.infer<typeof recipeOriginSchema>

// read_via / shared_from unchanged — encore-only recipes omit those fields
```

**Migration note:** Forward-only CHECK constraint update on `recipes.origin`; no backfill.
