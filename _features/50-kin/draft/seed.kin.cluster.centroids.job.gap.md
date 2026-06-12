# Draft: seed.kin.cluster.centroids.job.ts (gap — file does not exist)

Target: `backend/src/jobs/kin/seed.kin.cluster.centroids.job.ts`

**Gap (feature 50):** One-time / ops bootstrap for 8–16 coarse centroids.

---

```typescript
import { db } from '@/database/postgres'
import { kinCluster } from '@brioela/shared/drizzle/schema/kin.cluster.schema'
import {
	KIN_CLUSTER_COUNT_INITIAL_MIN,
} from '@brioela/shared/constants/kin/kin.serving.gates.constant'

/** Ops-only: changing cluster topology invalidates assignments — deliberate event */
export async function seedKinClusterCentroidsJob(): Promise<void> {
	const seeds = buildInitialCentroidSeeds(KIN_CLUSTER_COUNT_INITIAL_MIN)

	for (const seed of seeds) {
		await db
			.insert(kinCluster)
			.values({
				clusterId: seed.clusterId,
				centroidJson: JSON.stringify(seed.centroid),
				memberCount: 0,
			})
			.onConflictDoNothing()
	}
}

function buildInitialCentroidSeeds(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		clusterId: `kin_c${i + 1}`,
		centroid: {
			version: 1,
			referenceCategoryPeakDeltas: {
				refined_carbs: null,
				white_rice: null,
				fruit_juice: null,
				bread: null,
			},
			typicalTimeToPeakMin: 30 + i * 10,
			typicalReturnToBaselineMin: 60 + i * 15,
			fastingBaselineBandMgdl: null,
			responseVariance: 'unknown' as const,
			windowCount: 0,
		},
	}))
}
```

Tune from production data — not continuous re-clustering.
