# Draft: format.kin.verdict.row.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/format.kin.verdict.row.helper.ts`

**Gap (feature 50):** Observational Kin row copy — spec **47**, spec **01** wording discipline.

---

```typescript
import type { ProductKinResponseRow } from '@brioela/shared/drizzle/schema/kin.product.response.schema'

export type KinVerdictRow = {
	source: 'kin'
	headline: string
	sampleCount: number
	spikeRate: number | null
	disclaimer: string
}

const KIN_DISCLAIMER =
	'Group tendency from anonymous glucose responses — not a prediction about you.'

export function formatKinVerdictRow(aggregate: ProductKinResponseRow): KinVerdictRow {
	const spikePct =
		typeof aggregate.spikeRate === 'number'
			? Math.round(aggregate.spikeRate * 100)
			: null

	const spikePhrase =
		spikePct === null
			? 'mixed responses'
			: spikePct >= 50
				? 'usually spikes'
				: 'tends to stay flatter'

	const headline = `People with responses like yours: this ${spikePhrase} (n=${aggregate.sampleCount}${spikePct !== null ? `, ${spikePct}% spiked` : ''}).`

	return {
		source: 'kin',
		headline,
		sampleCount: aggregate.sampleCount,
		spikeRate: aggregate.spikeRate,
		disclaimer: KIN_DISCLAIMER,
	}
}

/** Banned in output — unit tests must reject */
export const KIN_BANNED_PHRASES = ['will spike', 'will raise', 'diagnose', 'insulin'] as const
```
