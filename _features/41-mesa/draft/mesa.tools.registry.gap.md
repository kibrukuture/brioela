# Draft: tools/mesa/index.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/mesa/index.ts` + individual tool files

**Gap:** No Mesa tools registered in **19** brain tool registry.

**Source:** `build-guide/26-mesa/03-mesa-tools.md`

---

```typescript
import { createMesaTool } from './create.mesa.tool'
import { addMesaMemberTool } from './add.mesa.member.tool'
import { addMesaConstraintTool } from './add.mesa.constraint.tool'
import { setFoodAudienceTool } from './set.food.audience.tool'
import { evaluateMesaCompatibilityTool } from './evaluate.mesa.compatibility.tool'
import { createMesaInviteTool } from './create.mesa.invite.tool'
import { acceptMesaContributionTool } from './accept.mesa.contribution.tool'
import { proposePotentialMemberTool } from './propose.potential.member.tool'
import { dismissPotentialMemberTool } from './dismiss.potential.member.tool'

export const mesaTools = [
	createMesaTool,
	addMesaMemberTool,
	addMesaConstraintTool,
	setFoodAudienceTool,
	evaluateMesaCompatibilityTool,
	createMesaInviteTool,
	acceptMesaContributionTool,
	proposePotentialMemberTool,
	dismissPotentialMemberTool,
] as const
```

```typescript
// create.mesa.tool.ts — pattern
import { z } from 'zod'
import { createMesa } from '@/agents/brain/_handlers/mesa/create.mesa.handler'

export const createMesaTool = {
	name: 'create_mesa',
	description: 'Create Mesa for multi-person food compatibility',
	inputSchema: z.object({
		displayName: z.string().nullable(),
		confirmationText: z.string(),
	}),
	execute: async (db, userId, input) => createMesa(db, userId, input.displayName),
}
```
