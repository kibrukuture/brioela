# Draft: tools/bela/index.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/bela/index.ts`

**Source:** `build-guide/11-bela/00-overview.md` § Tools Built In This Feature

---

```typescript
import { checkConstraintForOrderTool } from './check.constraint.for.order.tool'
import { proposeBelaOrderTool } from './propose.bela.order.tool'
import { releaseEscrowTool } from './release.escrow.tool'
import { connectTransferTool } from './connect.transfer.tool'

export const belaTools = [
	checkConstraintForOrderTool,
	proposeBelaOrderTool,
	releaseEscrowTool,
	connectTransferTool,
] as const

export type BelaToolName = (typeof belaTools)[number]['name']
```

```typescript
// check.constraint.for.order.tool.ts — excerpt
import { z } from 'zod'
import type { BrainToolDefinition } from '../../_types/brain.tool.definition'

export const checkConstraintForOrderTool: BrainToolDefinition = {
	name: 'check_constraint_for_order',
	description: 'Run order constraint check against a resolved product profile during Bela shopping.',
	inputSchema: z.object({
		orderId: z.string().uuid(),
		product: z.object({
			brand: z.string(),
			ingredients: z.array(z.string()),
			attributes: z.array(z.string()),
		}),
	}),
	sessionKinds: ['chat', 'cooking'],
	execute: async (ctx, input) => {
		return ctx.bela.checkConstraintForOrder(input)
	},
}
```
