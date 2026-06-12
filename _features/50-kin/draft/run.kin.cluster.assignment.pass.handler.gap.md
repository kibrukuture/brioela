# Draft: run.kin.cluster.assignment.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/kin/run.kin.cluster.assignment.pass.handler.ts`

**Gap (feature 50):** Monthly Brain alarm — fingerprint + nearest centroid.

---

```typescript
import { assignKinCluster } from '@/agents/brain/_helpers/kin/assign.kin.cluster.helper'
import { computeKinFingerprint } from '@/agents/brain/_helpers/kin/compute.kin.fingerprint.helper'
import type { BrainHandlerContext } from '@/agents/brain/_types/brain.handler.context'

export type RunKinClusterAssignmentPassInput = {
	userId: string
	now: number
}

export async function runKinClusterAssignmentPass(
	ctx: BrainHandlerContext,
	input: RunKinClusterAssignmentPassInput,
): Promise<{ clusterId: string | null }> {
	const kinState = await ctx.storage.kinState.getOrCreate(input.userId, input.now)
	if (!kinState.optedIn) return { clusterId: kinState.clusterId }

	const windows = await ctx.storage.glucoseMealWindows.listDerivedForUser(input.userId)
	const fingerprint = computeKinFingerprint({
		windows,
		productCategoryByProductId: await ctx.storage.products.categoryMapForUser(input.userId),
	})

	if (!fingerprint) return { clusterId: kinState.clusterId }

	const centroids = await ctx.env.kinCentroids.fetchAll()
	const assignment = assignKinCluster(fingerprint, centroids)

	const clusterId = assignment.assigned ? assignment.clusterId : kinState.clusterId

	await ctx.storage.kinState.update({
		userId: input.userId,
		fingerprintJson: JSON.stringify(fingerprint),
		clusterId,
		assignedAt: assignment.assigned ? input.now : kinState.assignedAt,
		updatedAt: input.now,
	})

	return { clusterId }
}
```

Alarm type: `kin_cluster_assignment` — seed in Brain init or maintenance (**14** dispatch).
