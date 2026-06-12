# Draft: format.kin.flattest.alternative.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/format.kin.flattest.alternative.helper.ts`

**Gap (feature 50):** **37** craving-decoder consumer — flattest sweet when no personal cause.

---

```typescript
import type { ProductKinResponseRow } from '@brioela/shared/drizzle/schema/kin.product.response.schema'
import { passesKinServingGates } from '@/agents/brain/_helpers/kin/passes.kin.serving.gates.helper'

export type KinFlattestAlternativeInput = {
	candidates: ReadonlyArray<{
		productId: string
		displayName: string
		aggregate: ProductKinResponseRow | null
		clusterMemberCount: number
	}>
}

export type KinFlattestAlternativeLine = {
	productId: string
	displayName: string
	line: string
}

export function formatKinFlattestAlternative(
	input: KinFlattestAlternativeInput,
): KinFlattestAlternativeLine | null {
	const eligible = input.candidates.filter((c) => {
		if (!c.aggregate) return false
		return passesKinServingGates({
			sampleCount: c.aggregate.sampleCount,
			clusterMemberCount: c.clusterMemberCount,
		})
	})

	if (eligible.length === 0) return null

	const flattest = [...eligible].sort((a, b) => {
		const rateA = a.aggregate?.spikeRate ?? 1
		const rateB = b.aggregate?.spikeRate ?? 1
		return rateA - rateB
	})[0]

	if (!flattest?.aggregate) return null

	return {
		productId: flattest.productId,
		displayName: flattest.displayName,
		line: `Among the sweet things you buy, ${flattest.displayName} tends to stay flatter for people with responses like yours.`,
	}
}
```
