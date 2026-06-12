# Draft: assemble.heirloom.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/heirloom/assemble.heirloom.tool.ts`

**Voice-first curation:** "add the doro wat and the bread, and write that she made the bread every Sunday"

---

```typescript
import { tool } from 'ai'
import { z } from '@brioela/shared/zod'
import { heirloomAssembleInputSchema } from '@brioela/shared/validator/heirloom/heirloom.schema'
import { createHeirloomHandler } from '@/agents/brain/_handlers/heirloom/create.heirloom.handler'

export const assembleHeirloomTool = tool({
	description:
		'Assemble an Heirloom bundle from owned heritage recipes, style profile, and moments. Explicit curation only.',
	parameters: heirloomAssembleInputSchema,
	execute: async (input, { experimental_context }) => {
		const ctx = experimental_context as { db: BrainDatabase; userId: string }
		return createHeirloomHandler(ctx.db, ctx.userId, input)
	},
})
```
