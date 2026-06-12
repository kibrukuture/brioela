# Draft: enqueue.kin.contribution.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/enqueue.kin.contribution.helper.ts`

**Gap (feature 50):** Fire-and-forget QStash after window derived.

---

```typescript
import { KIN_CONTRIBUTION_BUCKET_DAYS } from '@brioela/shared/constants/kin/kin.serving.gates.constant'
import { KIN_ROUTES } from '@brioela/shared/routes/kin.routes'
import type { BrainGlucoseMealWindow } from '@/agents/brain/_schemas/glucose.meal.window.schema'
import type { BrainKinState } from '@/agents/brain/_schemas/kin.state.schema'

type EnqueueKinContributionEnv = {
	QSTASH_URL: string
	QSTASH_TOKEN: string
	PUBLIC_API_BASE_URL: string
}

export async function enqueueKinContribution(args: {
	env: EnqueueKinContributionEnv
	kinState: BrainKinState
	window: BrainGlucoseMealWindow
	contributionToken: string
}): Promise<void> {
	if (!args.kinState.optedIn || !args.kinState.clusterId) return
	if (!args.window.productId || args.window.status !== 'derived') return
	if (args.window.confidence < 0.6) return

	const bucketStart = floorToBucketStart(new Date(args.window.capturedAt), KIN_CONTRIBUTION_BUCKET_DAYS)

	const body = {
		clusterId: args.kinState.clusterId,
		productId: args.window.productId,
		bucketStartIso: bucketStart.toISOString(),
		peakDeltaMgdl: peakDelta(args.window),
		timeToPeakMin: args.window.peakTimeMin,
		auc: args.window.auc,
		spikeAboveThreshold: isSpike(args.window),
		contributionToken: args.contributionToken,
	}

	await fetch(`${args.env.QSTASH_URL}/v2/publish/${args.env.PUBLIC_API_BASE_URL}${KIN_ROUTES.contribute}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${args.env.QSTASH_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})
}

function floorToBucketStart(date: Date, bucketDays: number): Date {
	const ms = bucketDays * 24 * 60 * 60 * 1000
	return new Date(Math.floor(date.getTime() / ms) * ms)
}

function peakDelta(window: BrainGlucoseMealWindow): number {
	if (window.peakMgdl == null || window.baselineMgdl == null) return 0
	return window.peakMgdl - window.baselineMgdl
}

function isSpike(window: BrainGlucoseMealWindow): boolean {
	return peakDelta(window) >= 30
}
```

No `user_id` in body. Failure may be silent — aggregates are statistics.
