# Draft: check.conditions.helper.ts (gap — file does not exist)

Target: `backend/src/api/scan/_helpers/check.conditions.helper.ts`

Source: `build-guide/22-medical-conditions/04-scan-verdict-integration.md`, `build-guide/07-scanner/03-constraint-check.md` (Brain RPC pattern)

**24-scanner** orchestrates; **23** owns evaluation body.

---

## Intended production file

```typescript
import type { Product } from '@brioela/shared'
import type { ConditionFlagResult } from '@brioela/shared/validator/medical.condition.schema'
import type { Env } from '@/types/env'

export type ScanConditionEvaluation = {
	conditionFlags: ConditionFlagResult[]
	guardrailsUnavailable: boolean
}

export async function checkProductConditions(
	product: Product,
	userId: string,
	env: Env,
): Promise<ScanConditionEvaluation> {
	const brainId = env.BRAIN.idFromName(userId)
	const brain = env.BRAIN.get(brainId)

	const response = await brain.fetch(new Request('https://internal/evaluate-product-conditions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.INTERNAL_SECRET}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ product }),
	}))

	if (!response.ok) {
		console.error('Condition check failed:', response.status)
		return { conditionFlags: [], guardrailsUnavailable: true }
	}

	return response.json() as Promise<ScanConditionEvaluation>
}
```

**Degraded rule:** `guardrailsUnavailable: true` → scan UI shows condition checks unavailable — same pattern as constraint `guardrails_unavailable` (**24**). Never imply condition pass.

**Call order in scan handler:** product resolution → **07** constraint check → **23** condition check → verdict assembly.
