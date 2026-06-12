# Draft: share.consent.level.constant.ts (gap — file does not exist)

Target: `shared/constants/viral.sharing/share.consent.level.constant.ts`

**Gap (feature 51):** Consent gates for preview and sensitive cards.

**Source:** `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`

---

```typescript
export const shareConsentLevelValues = [
	'none',
	'preview_confirmed',
	'explicit_sensitive_opt_in',
] as const

export type ShareConsentLevel = (typeof shareConsentLevelValues)[number]

export const defaultShareConsentLevel: ShareConsentLevel = 'preview_confirmed'

export const sensitiveCardTypes = ['personal_response'] as const
```
