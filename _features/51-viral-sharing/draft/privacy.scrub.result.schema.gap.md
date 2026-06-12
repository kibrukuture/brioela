# Draft: privacy.scrub.result.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/privacy.scrub.result.schema.ts`

**Gap (feature 51):** Scrub pipeline output — mandatory before render.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
import { z } from 'zod'

export const privacyScrubSensitivityValues = [
	'public_safe',
	'needs_user_review',
	'blocked',
] as const

export const privacyScrubRedactionSchema = z.object({
	field: z.string().min(1),
	reason: z.string().min(1),
})

export const privacyScrubResultSchema = z.object({
	allowed: z.boolean(),
	sensitivity: z.enum(privacyScrubSensitivityValues),
	redactions: z.array(privacyScrubRedactionSchema),
	requiresExplicitConsent: z.boolean(),
	safePayload: z.record(z.string(), z.unknown()),
})
export type PrivacyScrubResult = z.infer<typeof privacyScrubResultSchema>
```
