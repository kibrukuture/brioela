# Draft: privacy.scrub.discovery.card.policy.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_policies/viral.sharing/privacy.scrub.discovery.card.policy.ts`

**Gap (feature 51):** Critical privacy filter — every card type must pass.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
import type { DiscoveryCardType } from '@brioela/shared/constants/viral.sharing/discovery.card.type.constant'
import type { PrivacyScrubResult } from '@brioela/shared/validator/viral.sharing/privacy.scrub.result.schema'

const BLOCKED_FIELD_PATTERNS = [
	/allerg/i,
	/medical/i,
	/childName/i,
	/child_name/i,
	/exactLocation/i,
	/latitude/i,
	/longitude/i,
	/glucoseValue/i,
	/cgm/i,
	/practitioner/i,
	/clientId/i,
	/rawReceipt/i,
] as const

const BUSINESS_ACCUSATION_PATTERNS = [
	/unsafe restaurant/i,
	/this restaurant is unsafe/i,
	/is dangerous/i,
] as const

type ScrubInput = {
	cardType: DiscoveryCardType
	payload: Record<string, unknown>
	userConsentedSensitive: boolean
}

export function scrubDiscoveryCardPolicy(input: ScrubInput): PrivacyScrubResult {
	const redactions: PrivacyScrubResult['redactions'] = []
	const safePayload: Record<string, unknown> = { ...input.payload }

	for (const key of Object.keys(safePayload)) {
		if (BLOCKED_FIELD_PATTERNS.some((re) => re.test(key))) {
			redactions.push({ field: key, reason: 'blocked_field_name' })
			delete safePayload[key]
		}
	}

	const finding = typeof safePayload.finding === 'string' ? safePayload.finding : ''
	for (const pattern of BUSINESS_ACCUSATION_PATTERNS) {
		if (pattern.test(finding)) {
			return blockedResult(redactions, 'business_accusation_language')
		}
	}

	if (input.cardType === 'personal_response' && !input.userConsentedSensitive) {
		return blockedResult(redactions, 'personal_response_requires_explicit_opt_in')
	}

	if (input.cardType === 'kids_learning') {
		delete safePayload.childName
		delete safePayload.childPhotoUrl
		redactions.push({ field: 'childName', reason: 'child_identity_never_default' })
	}

	if (input.cardType === 'ground_find' && safePayload.groundApprovedPublic !== true) {
		return blockedResult(redactions, 'ground_find_not_approved')
	}

	const sensitivity =
		redactions.length === 0 ? 'public_safe' : ('needs_user_review' as const)

	return {
		allowed: true,
		sensitivity,
		redactions,
		requiresExplicitConsent: input.cardType === 'personal_response',
		safePayload,
	}
}

function blockedResult(
	redactions: PrivacyScrubResult['redactions'],
	reason: string,
): PrivacyScrubResult {
	return {
		allowed: false,
		sensitivity: 'blocked',
		redactions: [...redactions, { field: '*', reason }],
		requiresExplicitConsent: false,
		safePayload: {},
	}
}
```
