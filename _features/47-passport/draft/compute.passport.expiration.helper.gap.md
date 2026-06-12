# Draft: compute.passport.expiration.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/compute.passport.expiration.helper.ts`

**Gap (feature 47):** Per-kind default expiration timestamps.

**Source:** `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import type { PassportKind } from '@brioela/shared/constants/passport/passport.kind.constant'

const END_OF_LOCAL_DAY_MS = 24 * 60 * 60 * 1000

export function computePassportExpiration(kind: PassportKind, now = Date.now()): number {
	switch (kind) {
		case 'restaurant_menu':
		case 'mesa_table':
		case 'personal_food_safety':
			return now + END_OF_LOCAL_DAY_MS
		case 'bela_shopper':
			// TODO(42): prefer order.estimatedCompletionAt when order id known
			return now + END_OF_LOCAL_DAY_MS
		case 'travel_translation':
			// TODO(35): prefer travel_intent.return window when active
			return now + 14 * END_OF_LOCAL_DAY_MS
		case 'caregiver_school':
			return now + 30 * END_OF_LOCAL_DAY_MS
		case 'practitioner_guidance':
			return now + 90 * END_OF_LOCAL_DAY_MS
		default: {
			const _exhaustive: never = kind
			return now + END_OF_LOCAL_DAY_MS
		}
	}
}
```
