# Draft: build.discovery.card.from.moment.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/build.discovery.card.from.moment.helper.ts`

**Gap (feature 51):** Scrubbed moment → `DiscoveryCard` for preview.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`, `04-feature-specific-card-types.md`

---

```typescript
import { randomUUID } from 'node:crypto'
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'
import type { BrioelaMoment } from '@brioela/shared/validator/viral.sharing/brioela.moment.schema'
import type { PrivacyScrubResult } from '@brioela/shared/validator/viral.sharing/privacy.scrub.result.schema'
import { discoveryCardCtaForType } from '@brioela/shared/constants/viral.sharing/discovery.card.cta.constant'

export function buildDiscoveryCardFromMoment(input: {
	moment: BrioelaMoment
	scrub: PrivacyScrubResult
}): DiscoveryCard | null {
	if (!input.scrub.allowed) return null

	const p = input.scrub.safePayload
	const title = readString(p, 'title') ?? readString(p, 'productName') ?? 'Discovery'
	const finding = readString(p, 'finding') ?? readString(p, 'verdictSentence')
	if (!finding) return null

	const privacyLevel =
		input.scrub.sensitivity === 'public_safe' ? 'public_safe' : 'reviewed_sensitive'

	return {
		cardId: randomUUID(),
		cardType: input.moment.suggestedCardType,
		title,
		finding,
		contextLine: readString(p, 'contextLine'),
		visualEntity: {
			kind: readVisualKind(p),
			name: readString(p, 'visualName') ?? title,
			imageUrl: readString(p, 'imageUrl'),
		},
		attribution: discoveryCardCtaForType(input.moment.suggestedCardType),
		cta: discoveryCardCtaForType(input.moment.suggestedCardType),
		privacyLevel,
	}
}

function readString(payload: Record<string, unknown>, key: string): string | null {
	const v = payload[key]
	return typeof v === 'string' && v.length > 0 ? v : null
}

function readVisualKind(
	payload: Record<string, unknown>,
): DiscoveryCard['visualEntity']['kind'] {
	const k = payload.visualKind
	if (k === 'product' || k === 'recipe' || k === 'place' || k === 'menu') return k
	return 'generic'
}
```
