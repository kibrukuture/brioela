# Draft: discovery.card.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/discovery.card.schema.ts`

**Gap (feature 51):** Post-scrub card shape for preview and render.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`

---

```typescript
import { z } from 'zod'
import { discoveryCardTypeValues } from '@brioela/shared/constants/viral.sharing/discovery.card.type.constant'

export const discoveryCardVisualEntityKindValues = [
	'product',
	'recipe',
	'place',
	'menu',
	'generic',
] as const

export const discoveryCardPrivacyLevelValues = [
	'public_safe',
	'reviewed_sensitive',
] as const

export const discoveryCardVisualEntitySchema = z.object({
	kind: z.enum(discoveryCardVisualEntityKindValues),
	name: z.string().min(1).max(200),
	imageUrl: z.string().url().nullable(),
})

export const discoveryCardSchema = z.object({
	cardId: z.string().min(1),
	cardType: z.enum(discoveryCardTypeValues),
	title: z.string().min(1).max(120),
	finding: z.string().min(1).max(280),
	contextLine: z.string().min(1).max(200).nullable(),
	visualEntity: discoveryCardVisualEntitySchema,
	attribution: z.string().min(1).max(80),
	cta: z.string().min(1).max(80).nullable(),
	privacyLevel: z.enum(discoveryCardPrivacyLevelValues),
})
export type DiscoveryCard = z.infer<typeof discoveryCardSchema>
```
