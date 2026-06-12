# Draft: scrub.discovery.card.payload.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/scrub.discovery.card.payload.helper.ts`

**Gap (feature 51):** Policy wrapper for emitters and preview path.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
import type { DiscoveryCardType } from '@brioela/shared/constants/viral.sharing/discovery.card.type.constant'
import type { PrivacyScrubResult } from '@brioela/shared/validator/viral.sharing/privacy.scrub.result.schema'
import { scrubDiscoveryCardPolicy } from '@/agents/brain/_policies/viral.sharing/privacy.scrub.discovery.card.policy'

type ScrubDiscoveryCardPayloadInput = {
	cardType: DiscoveryCardType
	payload: Record<string, unknown>
	userConsentedSensitive: boolean
}

export function scrubDiscoveryCardPayload(
	input: ScrubDiscoveryCardPayloadInput,
): PrivacyScrubResult {
	return scrubDiscoveryCardPolicy({
		cardType: input.cardType,
		payload: input.payload,
		userConsentedSensitive: input.userConsentedSensitive,
	})
}
```
