# Draft: viral.sharing.api.ts (gap — file does not exist)

Target: `mobile/network/viral.sharing/viral.sharing.api.ts`

**Gap (feature 51):** Mobile client for preview + confirm (used by **48** Encore trigger).

**Source:** `_features/48-encore/draft/encore.discovery.card.trigger.gap.md`

---

```typescript
import { API_ROUTES } from '@brioela/shared/routes'
import { api } from '@/network/core/api.client'
import type { RequestDiscoveryCardInput } from '@brioela/shared/validator/viral.sharing/request.discovery.card.schema'
import type { ConfirmDiscoveryCardShareInput } from '@brioela/shared/validator/viral.sharing/confirm.discovery.card.share.schema'
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'

export async function requestDiscoveryCard(
	body: RequestDiscoveryCardInput,
): Promise<{ card: DiscoveryCard; requiresExplicitConsent: boolean }> {
	return api.post(API_ROUTES.viralSharing.requestCard(), body)
}

export async function confirmDiscoveryCardShare(
	body: ConfirmDiscoveryCardShareInput,
): Promise<{ artifactRef: string; mimeType: 'image/png' }> {
	return api.post(API_ROUTES.viralSharing.confirmShare(), body)
}
```
