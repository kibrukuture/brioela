# Draft: archive.user.recipe.tool

Target: `backend/src/agents/brain/_tools/archive.user.recipe.tool.ts`

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { archiveUserRecipeSchema } from '@/agents/brain/_tools/_schemas/archive.user.recipe.schema'
import { archiveUserRecipePrompt } from '@/agents/brain/_tools/_prompts/archive.user.recipe.prompt'
import { archiveUserRecipeExecutable } from '@/agents/brain/_tools/_executables/archive.user.recipe.executable'

export const archiveUserRecipeTool = (db: BrainDatabase) => tool({
	description: archiveUserRecipePrompt,
	inputSchema: archiveUserRecipeSchema,
	execute: async (params) => archiveUserRecipeExecutable(db, params),
})
```
