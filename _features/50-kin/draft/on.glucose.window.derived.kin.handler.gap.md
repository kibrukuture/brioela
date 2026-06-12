# Draft: on.glucose.window.derived.kin.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/kin/on.glucose.window.derived.kin.handler.ts`

**Gap (feature 50):** Called from **36** `derive.glucose.window.metrics` path.

---

```typescript
import { enqueueKinContribution } from '@/agents/brain/_helpers/kin/enqueue.kin.contribution.helper'
import type { BrainGlucoseMealWindow } from '@/agents/brain/_schemas/glucose.meal.window.schema'
import type { BrainHandlerContext } from '@/agents/brain/_types/brain.handler.context'

export async function onGlucoseWindowDerivedKin(
	ctx: BrainHandlerContext,
	window: BrainGlucoseMealWindow,
): Promise<void> {
	const kinState = await ctx.storage.kinState.getOrCreate(window.userId, Date.now())
	if (!kinState.optedIn || !kinState.clusterId) return

	const contributionId = crypto.randomUUID()
	const now = Date.now()

	await ctx.storage.kinContributionLog.insert({
		contributionId,
		userId: window.userId,
		productId: window.productId!,
		windowId: window.windowId,
		clusterId: kinState.clusterId,
		status: 'active',
		contributedAt: now,
		createdAt: now,
	})

	const contributionToken = await ctx.env.kinTokens.mintContributionToken({
		contributionId,
		clusterId: kinState.clusterId,
		productId: window.productId!,
	})

	await enqueueKinContribution({
		env: ctx.env,
		kinState,
		window,
		contributionToken,
	})

	await ctx.storage.kinState.update({
		userId: window.userId,
		lastContributionAt: now,
		updatedAt: now,
	})
}
```

Fire-and-forget — must not block scan or session paths.
