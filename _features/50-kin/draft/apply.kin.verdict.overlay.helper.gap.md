# Draft: apply.kin.verdict.overlay.helper.ts (gap — file does not exist)

Target: `backend/src/core/products/apply.kin.verdict.overlay.helper.ts`

**Gap (feature 50):** Scanner (**24**) consumer — trust order.

---

```typescript
import { formatKinVerdictRow } from '@/agents/brain/_helpers/kin/format.kin.verdict.row.helper'
import { readProductKinResponseCached } from '@/core/products/read.product.kin.response.cached.helper'
import type { KinVerdictRow } from '@/agents/brain/_helpers/kin/format.kin.verdict.row.helper'

export type PersonalGlucoseLine = {
	source: 'personal'
	headline: string
}

export type VerdictGlucoseOverlay = {
	personal: PersonalGlucoseLine | null
	kin: KinVerdictRow | null
	exceptionNote: string | null
}

export async function applyKinVerdictOverlay(args: {
	env: Env
	productId: string
	clusterId: string | null
	clusterMemberCount: number
	personalLine: PersonalGlucoseLine | null
	kinRowEligible: boolean
}): Promise<VerdictGlucoseOverlay> {
	if (!args.kinRowEligible || !args.clusterId) {
		return { personal: args.personalLine, kin: null, exceptionNote: null }
	}

	const aggregate = await readProductKinResponseCached({
		env: args.env,
		productId: args.productId,
		clusterId: args.clusterId,
		clusterMemberCount: args.clusterMemberCount,
	})

	const kin = aggregate ? formatKinVerdictRow(aggregate) : null

	let exceptionNote: string | null = null
	if (args.personalLine && kin) {
		const personalFlat = args.personalLine.headline.toLowerCase().includes('flat')
		const kinSpike = kin.headline.toLowerCase().includes('spike')
		if (personalFlat && kinSpike) {
			exceptionNote = "Your own data: flat. (Your group tends to spike — you're an exception on this one.)"
		}
	}

	// Trust order: personal always wins for primary headline; Kin fills cold start
	if (args.personalLine) {
		return { personal: args.personalLine, kin, exceptionNote }
	}

	return { personal: null, kin, exceptionNote: null }
}
```

Call site checks `checkTierAccess(userId, 'kin_row')` (**43**) before invoking.
