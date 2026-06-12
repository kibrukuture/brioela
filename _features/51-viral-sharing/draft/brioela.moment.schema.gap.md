# Draft: brioela.moment.schema.ts (gap — file does not exist)

Target: `shared/validator/viral.sharing/brioela.moment.schema.ts`

**Gap (feature 51):** Emitter contract from product features.

**Source:** `build-guide/24-viral-sharing/01-shareable-moment-taxonomy.md`

---

```typescript
import { z } from 'zod'
import { discoveryCardTypeValues } from '@brioela/shared/constants/viral.sharing/discovery.card.type.constant'

export const brioelaMomentSourceFeatureValues = [
	'scanner',
	'kids_mode',
	'mesa',
	'menu_scanning',
	'recipe_ingestion',
	'cooking_session',
	'receipt',
	'ground',
	'wearables',
	'encore',
	'pantry_meal_plan',
	'harvest',
] as const

export const brioelaMomentEntityKindValues = [
	'product',
	'recipe',
	'restaurant',
	'menu',
	'place',
	'meal_plan',
	'scan',
	'find',
	'session',
	'edition',
] as const

export const brioelaMomentSensitivityValues = [
	'public_safe',
	'needs_review',
	'sensitive',
	'blocked',
] as const

export const brioelaMomentSchema = z.object({
	momentId: z.string().min(1),
	kind: z.string().min(1),
	sourceFeature: z.enum(brioelaMomentSourceFeatureValues),
	entityKind: z.enum(brioelaMomentEntityKindValues),
	entityId: z.string().min(1),
	suggestedCardType: z.enum(discoveryCardTypeValues),
	sensitivity: z.enum(brioelaMomentSensitivityValues),
	rawPayload: z.record(z.string(), z.unknown()),
	createdAt: z.number().int().positive(),
})
export type BrioelaMoment = z.infer<typeof brioelaMomentSchema>

export const emitBrioelaMomentInputSchema = brioelaMomentSchema.omit({ createdAt: true })
export type EmitBrioelaMomentInput = z.infer<typeof emitBrioelaMomentInputSchema>
```
