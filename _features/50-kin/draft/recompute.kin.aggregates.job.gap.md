# Draft: recompute.kin.aggregates.job.ts (gap — file does not exist)

Target: `backend/src/jobs/kin/recompute.kin.aggregates.job.ts`

**Gap (feature 50):** Hourly Supabase batch — tendency data, not real-time.

---

```typescript
import { db } from '@/database/postgres'
import { productKinResponse } from '@brioela/shared/drizzle/schema/kin.product.response.schema'
import { kinCluster } from '@brioela/shared/drizzle/schema/kin.cluster.schema'

type PendingKinContribution = {
	clusterId: string
	productId: string
	peakDeltaMgdl: number
	timeToPeakMin: number | null
	auc: number | null
	spikeAboveThreshold: boolean
	withdrawn: boolean
}

export async function recomputeKinAggregatesJob(): Promise<void> {
	const pending: PendingKinContribution[] = await db.kinContributionQueue.drainActive()

	const byKey = new Map<string, PendingKinContribution[]>()
	for (const row of pending) {
		if (row.withdrawn) continue
		const key = `${row.productId}::${row.clusterId}`
		const list = byKey.get(key) ?? []
		list.push(row)
		byKey.set(key, list)
	}

	for (const [key, rows] of byKey) {
		const [productId, clusterId] = key.split('::')
		const spikeRate = rows.filter((r) => r.spikeAboveThreshold).length / rows.length
		const medianPeakDelta = median(rows.map((r) => r.peakDeltaMgdl))
		const medianAuc = median(rows.map((r) => r.auc).filter((v): v is number => v != null))

		await db
			.insert(productKinResponse)
			.values({
				productId: productId!,
				clusterId: clusterId!,
				sampleCount: rows.length,
				spikeRate,
				medianPeakDelta,
				medianAuc,
			})
			.onConflictDoUpdate({
				target: [productKinResponse.productId, productKinResponse.clusterId],
				set: {
					sampleCount: rows.length,
					spikeRate,
					medianPeakDelta,
					medianAuc,
					updatedAt: new Date(),
				},
			})
	}

	await db.kinCluster.refreshMemberCounts()
}

function median(values: number[]): number | null {
	if (values.length === 0) return null
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}
```

Serving gates enforced at **read** time only — rows below floor may exist in DB.
