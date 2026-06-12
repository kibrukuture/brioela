# Draft: assign.kin.cluster.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/assign.kin.cluster.helper.ts`

**Gap (feature 50):** Nearest-centroid assignment; 10-window floor.

---

```typescript
import type { KinFingerprintVector } from '@brioela/shared/validator/kin/kin.fingerprint.vector.schema'
import { MIN_KIN_WINDOWS_FOR_ASSIGNMENT } from '@brioela/shared/constants/kin/kin.serving.gates.constant'

export type KinClusterCentroid = {
	clusterId: string
	centroid: KinFingerprintVector
	memberCount: number
}

export type AssignKinClusterResult =
	| { assigned: false; reason: 'insufficient_windows' }
	| { assigned: true; clusterId: string }

export function assignKinCluster(
	fingerprint: KinFingerprintVector,
	centroids: readonly KinClusterCentroid[],
): AssignKinClusterResult {
	if (fingerprint.windowCount < MIN_KIN_WINDOWS_FOR_ASSIGNMENT) {
		return { assigned: false, reason: 'insufficient_windows' }
	}

	let best: { clusterId: string; distance: number } | null = null
	for (const c of centroids) {
		const distance = euclideanFingerprintDistance(fingerprint, c.centroid)
		if (!best || distance < best.distance) {
			best = { clusterId: c.clusterId, distance }
		}
	}

	if (!best) return { assigned: false, reason: 'insufficient_windows' }
	return { assigned: true, clusterId: best.clusterId }
}

function euclideanFingerprintDistance(a: KinFingerprintVector, b: KinFingerprintVector): number {
	const ttpA = a.typicalTimeToPeakMin ?? 0
	const ttpB = b.typicalTimeToPeakMin ?? 0
	const retA = a.typicalReturnToBaselineMin ?? 0
	const retB = b.typicalReturnToBaselineMin ?? 0
	const varPenalty = a.responseVariance === b.responseVariance ? 0 : 1
	return Math.hypot(ttpA - ttpB, retA - retB) + varPenalty
}
```

Only `clusterId` leaves the DO on the contribution path — not the fingerprint.
