# Draft: opt.out.kin.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/kin/opt.out.kin.handler.ts`

**Gap (feature 50):** Reciprocal opt-out — both directions.

---

```typescript
import type { BrainHandlerContext } from '@/agents/brain/_types/brain.handler.context'
import { withdrawAllKinContributions } from '@/agents/brain/_helpers/kin/withdraw.kin.contributions.helper'

export type OptOutKinInput = {
	userId: string
	now: number
}

export type OptOutKinResult = {
	optedIn: false
	withdrawnCount: number
	reciprocityCopy: string
}

const OPT_OUT_COPY =
	'Kin is off. You will not see group response patterns, and your anonymous contributions have been withdrawn. Turn it back on anytime to rejoin both directions.'

export async function optOutKin(ctx: BrainHandlerContext, input: OptOutKinInput): Promise<OptOutKinResult> {
	await ctx.storage.kinState.update({
		userId: input.userId,
		optedIn: false,
		updatedAt: input.now,
	})

	const withdrawnCount = await withdrawAllKinContributions(ctx.storage, input.userId, input.now)

	return {
		optedIn: false,
		withdrawnCount,
		reciprocityCopy: OPT_OUT_COPY,
	}
}
```
