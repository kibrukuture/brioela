# Draft: opt.in.kin.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/kin/opt.in.kin.handler.ts`

**Gap (feature 50):** Reciprocal opt-in — value-first prompt already shown in UI.

---

```typescript
import type { BrainHandlerContext } from '@/agents/brain/_types/brain.handler.context'

export type OptInKinInput = {
	userId: string
	now: number
}

export type OptInKinResult = {
	optedIn: true
	clusterId: string | null
	reciprocityCopy: string
}

const RECIPROCITY_COPY =
	'You will see anonymous response patterns from people metabolically similar to you, and contribute yours anonymously in return. You can turn this off anytime in Connected Devices — that stops both directions.'

export async function optInKin(ctx: BrainHandlerContext, input: OptInKinInput): Promise<OptInKinResult> {
	const state = await ctx.storage.kinState.getOrCreate(input.userId, input.now)
	const updated = await ctx.storage.kinState.update({
		userId: input.userId,
		optedIn: true,
		updatedAt: input.now,
	})

	return {
		optedIn: true,
		clusterId: updated.clusterId ?? state.clusterId,
		reciprocityCopy: RECIPROCITY_COPY,
	}
}
```

Prerequisite enforced in UI: CGM connected + ≥1 personal correlation shown before prompt.
