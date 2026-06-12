# Draft: confirm.discovery.card.share.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/viral.sharing/confirm.discovery.card.share.handler.ts`

**Gap (feature 51):** Consent + render + audit after preview.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
import { confirmDiscoveryCardShareSchema } from '@brioela/shared/validator/viral.sharing/confirm.discovery.card.share.schema'
import { sensitiveCardTypes } from '@brioela/shared/constants/viral.sharing/share.consent.level.constant'
import { buildDiscoveryCardGrammarDocument } from '@/agents/brain/_helpers/viral.sharing/build.discovery.card.grammar.document.helper'
import { renderDiscoveryCardStatic } from '@/agents/brain/_helpers/viral.sharing/render.discovery.card.static.helper'
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'

export type ConfirmDiscoveryCardShareResult =
	| { ok: true; artifactRef: string; mimeType: 'image/png' }
	| { ok: false; reason: 'consent_required' | 'card_not_found' }

type Deps = {
	loadCard: (cardId: string) => Promise<DiscoveryCard | null>
	uploadArtifact: (bytes: Uint8Array, mimeType: 'image/png') => Promise<string>
	markOfferShared: (cardId: string, artifactRef: string) => Promise<void>
}

export async function confirmDiscoveryCardShareHandler(
	raw: unknown,
	deps: Deps,
): Promise<ConfirmDiscoveryCardShareResult> {
	const input = confirmDiscoveryCardShareSchema.parse(raw)
	const card = await deps.loadCard(input.cardId)
	if (!card) return { ok: false, reason: 'card_not_found' }

	const needsSensitive =
		(sensitiveCardTypes as readonly string[]).includes(card.cardType)
	if (needsSensitive && input.consentLevel !== 'explicit_sensitive_opt_in') {
		return { ok: false, reason: 'consent_required' }
	}
	if (input.consentLevel === 'none') {
		return { ok: false, reason: 'consent_required' }
	}

	const grammarDoc = buildDiscoveryCardGrammarDocument(card)
	const rendered = await renderDiscoveryCardStatic({
		card,
		grammarDocumentJson: JSON.stringify(grammarDoc),
	})

	const artifactRef = await deps.uploadArtifact(rendered.bytes, rendered.mimeType)
	await deps.markOfferShared(card.cardId, artifactRef)

	return { ok: true, artifactRef, mimeType: 'image/png' }
}
```
