# Draft: request.discovery.card.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/viral.sharing/request.discovery.card.handler.ts`

**Gap (feature 51):** Preview path — score already passed; scrub + build card.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md` steps 3–4

---

```typescript
import { requestDiscoveryCardSchema } from '@brioela/shared/validator/viral.sharing/request.discovery.card.schema'
import { scrubDiscoveryCardPayload } from '@/agents/brain/_helpers/viral.sharing/scrub.discovery.card.payload.helper'
import { buildDiscoveryCardFromMoment } from '@/agents/brain/_helpers/viral.sharing/build.discovery.card.from.moment.helper'
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'

export type RequestDiscoveryCardResult =
	| { ok: true; card: DiscoveryCard; requiresExplicitConsent: boolean }
	| { ok: false; reason: 'blocked' | 'scrub_failed' }

export async function requestDiscoveryCardHandler(
	raw: unknown,
): Promise<RequestDiscoveryCardResult> {
	const input = requestDiscoveryCardSchema.parse(raw)
	const scrub = scrubDiscoveryCardPayload({
		cardType: input.suggestedCardType,
		payload: input.rawPayload,
		userConsentedSensitive: false,
	})

	if (!scrub.allowed) {
		return { ok: false, reason: 'blocked' }
	}

	const moment = {
		momentId: input.momentId,
		kind: input.kind,
		sourceFeature: input.sourceFeature,
		entityKind: input.entityKind,
		entityId: input.entityId,
		suggestedCardType: input.suggestedCardType,
		sensitivity: input.sensitivity,
		rawPayload: input.rawPayload,
		createdAt: Date.now(),
	}

	const card = buildDiscoveryCardFromMoment({ moment, scrub })
	if (!card) return { ok: false, reason: 'scrub_failed' }

	return {
		ok: true,
		card,
		requiresExplicitConsent: scrub.requiresExplicitConsent,
	}
}
```
