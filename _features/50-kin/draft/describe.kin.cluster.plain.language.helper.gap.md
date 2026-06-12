# Draft: describe.kin.cluster.plain.language.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/describe.kin.cluster.plain.language.helper.ts`

**Gap (feature 50):** Transparency UI copy — spec **47**.

---

```typescript
import type { KinClusterCentroid } from '@/agents/brain/_helpers/kin/assign.kin.cluster.helper'

export function describeKinClusterPlainLanguage(centroid: KinClusterCentroid): string {
	const fp = centroid.centroid
	const spikeSpeed =
		(fp.typicalTimeToPeakMin ?? 60) <= 45 ? 'spike fast' : 'rise more gradually'
	const recovery =
		(fp.typicalReturnToBaselineMin ?? 120) <= 90 ? 'recover quickly' : 'take longer to settle'
	const variance = fp.responseVariance === 'volatile' ? 'with variable responses' : 'fairly consistently'

	return `Your responses are pooled with people who ${spikeSpeed} on refined carbs and ${recovery} ${variance}.`
}
```

No cluster_id shown to user — plain language only.
