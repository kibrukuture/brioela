# Draft: create.encore.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/encore/create.encore.tool.ts`

**Gap (feature 48):** Agent-invoked Encore capture when user says "Encore this" with photo confirmed.

```typescript
import { z } from '@brioela/shared/zod'
import { defineBrainTool } from '@/agents/brain/tools/define.brain.tool'
import { createEncoreHandler } from '@/agents/brain/_handlers/encore/create.encore.handler'

export const createEncoreTool = defineBrainTool({
	name: 'create_encore',
	description:
		'Start Encore dish reconstruction from a confirmed plate photo. Use only after the user explicitly wants to recreate the dish.',
	inputSchema: z.object({
		photoUploadIds: z.array(z.string()).min(1),
		voiceTranscript: z.string().optional(),
	}),
	execute: async ({ ctx, input }) => {
		const result = await createEncoreHandler(ctx.db, ctx.env, ctx.userId, {
			photoUploadIds: input.photoUploadIds,
			voiceTranscript: input.voiceTranscript,
			context: {
				capturedAt: Date.now(),
				// place/menu context filled by enrich helper in handler path
			},
		})

		return {
			encoreId: result.encoreId,
			message: "Working on it — I'll have a recipe shortly.",
		}
	},
})
```
