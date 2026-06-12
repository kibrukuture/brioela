# Draft: apply.kin.meal.plan.overlay.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/apply.kin.meal.plan.overlay.helper.ts`

**Gap (feature 50):** **34** consumer — cluster response replaces population GI when personal data absent.

---

```typescript
import { readProductKinResponseCached } from '@/core/products/read.product.kin.response.cached.helper'

export type MealPlanGlycemicSignal = {
	source: 'personal' | 'kin' | 'population'
	estimatedSpikeRisk: number
	productId: string
}

export async function resolveMealPlanGlycemicSignal(args: {
	env: Env
	productId: string
	clusterId: string | null
	clusterMemberCount: number
	hasPersonalGlucoseHistory: boolean
	populationGiRisk: number
	kinEligible: boolean
}): Promise<MealPlanGlycemicSignal> {
	if (args.hasPersonalGlucoseHistory) {
		return {
			source: 'personal',
			estimatedSpikeRisk: args.populationGiRisk,
			productId: args.productId,
		}
	}

	if (args.kinEligible && args.clusterId) {
		const aggregate = await readProductKinResponseCached({
			env: args.env,
			productId: args.productId,
			clusterId: args.clusterId,
			clusterMemberCount: args.clusterMemberCount,
		})
		if (aggregate?.spikeRate != null) {
			return {
				source: 'kin',
				estimatedSpikeRisk: aggregate.spikeRate,
				productId: args.productId,
			}
		}
	}

	return {
		source: 'population',
		estimatedSpikeRisk: args.populationGiRisk,
		productId: args.productId,
	}
}
```
