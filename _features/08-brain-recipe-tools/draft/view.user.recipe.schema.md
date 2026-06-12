# Draft: view.user.recipe.schema

Target: `backend/src/agents/brain/_tools/_schemas/view.user.recipe.schema.ts`

```typescript
import { z } from '@brioela/shared/zod'

export const viewUserRecipeSchema = z.object({
	id: z .uuid().describe('Recipe UUID from the session recipe index.'),
})
```
