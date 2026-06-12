# Draft: archive.user.recipe.schema

Target: `backend/src/agents/brain/_tools/_schemas/archive.user.recipe.schema.ts`

```typescript
import { z } from '@brioela/shared/zod'

export const archiveUserRecipeSchema = z.object({
	id: z.uuid().describe('Recipe UUID to archive.'),
	reason: z.string().min(1).describe('Why this recipe is being archived.'),
})
```
