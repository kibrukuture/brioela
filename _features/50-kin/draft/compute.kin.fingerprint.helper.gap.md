# Draft: compute.kin.fingerprint.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/compute.kin.fingerprint.helper.ts`

**Gap (feature 50):** Fingerprint from `glucose_meal_window` derived rows (**36**).

---

```typescript
import type { BrainGlucoseMealWindow } from '@/agents/brain/_schemas/glucose.meal.window.schema'
import {
	kinFingerprintVectorSchema,
	type KinFingerprintVector,
} from '@brioela/shared/validator/kin/kin.fingerprint.vector.schema'

type ComputeKinFingerprintInput = {
	windows: BrainGlucoseMealWindow[]
	productCategoryByProductId: ReadonlyMap<string, string>
}

export function computeKinFingerprint(input: ComputeKinFingerprintInput): KinFingerprintVector | null {
	if (input.windows.length === 0) return null

	const derived = input.windows.filter((w) => w.status === 'derived' && w.confidence >= 0.6)
	if (derived.length === 0) return null

	// Aggregate normalized response characteristics per build-guide/34-kin/01
	const vector: KinFingerprintVector = {
		version: 1,
		referenceCategoryPeakDeltas: {
			refined_carbs: null,
			white_rice: null,
			fruit_juice: null,
			bread: null,
		},
		typicalTimeToPeakMin: median(derived.map((w) => w.peakTimeMin)),
		typicalReturnToBaselineMin: median(derived.map((w) => w.returnToBaselineMin)),
		fastingBaselineBandMgdl: baselineBand(derived),
		responseVariance: varianceLabel(derived),
		windowCount: derived.length,
	}

	return kinFingerprintVectorSchema.parse(vector)
}

function median(values: Array<number | null | undefined>): number | null {
	const nums = values.filter((v): v is number => typeof v === 'number')
	if (nums.length === 0) return null
	const sorted = [...nums].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

function baselineBand(windows: BrainGlucoseMealWindow[]): KinFingerprintVector['fastingBaselineBandMgdl'] {
	const baselines = windows.map((w) => w.baselineMgdl).filter((v): v is number => typeof v === 'number')
	if (baselines.length === 0) return null
	return { low: Math.min(...baselines), high: Math.max(...baselines) }
}

function varianceLabel(windows: BrainGlucoseMealWindow[]): KinFingerprintVector['responseVariance'] {
	const peaks = windows.map((w) => w.peakMgdl).filter((v): v is number => typeof v === 'number')
	if (peaks.length < 3) return 'unknown'
	const mean = peaks.reduce((a, b) => a + b, 0) / peaks.length
	const variance = peaks.reduce((acc, p) => acc + (p - mean) ** 2, 0) / peaks.length
	return variance > 400 ? 'volatile' : 'stable'
}
```
