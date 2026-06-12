# Draft: confirm.discovery.card.share.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/confirm.discovery.card.share.schema.ts`

**Gap (feature 51):** Post-preview consent + render confirm.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
import { z } from 'zod'
import { shareConsentLevelValues } from '@brioela/shared/constants/viral.sharing/share.consent.level.constant'

export const confirmDiscoveryCardShareSchema = z.object({
	cardId: z.string().min(1),
	consentLevel: z.enum(shareConsentLevelValues),
})
export type ConfirmDiscoveryCardShareInput = z.infer<typeof confirmDiscoveryCardShareSchema>
```
