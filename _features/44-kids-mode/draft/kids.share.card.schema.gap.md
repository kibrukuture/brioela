# Draft: kids.share.card.schema.ts (gap — file does not exist)

Target: `shared/validator/kids.mode/kids.share.card.schema.ts`

**Gap:** No share payload contract for **51** `kids_learning` handoff.

**Source:** `build-guide/21-kids-mode/04-share-card.md`, `build-guide/24-viral-sharing/04-feature-specific-card-types.md`

---

```typescript
import { z } from 'zod'
import { kidsModeAgeRangeSchema } from './kids.scan.explanation.schema'

export const kidsShareCardAttribution = 'we scanned this together with Brioela' as const

export const kidsShareCardSchema = z.object({
	scanEventId: z.string().min(1),
	productName: z.string().min(1).max(120),
	productImageUrl: z.string().url().nullable(),
	verdictSentence: z.string().min(1).max(280),
	coolFact: z.string().min(1).max(320),
	ageRange: kidsModeAgeRangeSchema,
	attribution: z.literal(kidsShareCardAttribution),
})
export type KidsShareCard = z.infer<typeof kidsShareCardSchema>

export const buildKidsShareCardInputSchema = z.object({
	scanEventId: z.string().min(1),
})
export type BuildKidsShareCardInput = z.infer<typeof buildKidsShareCardInputSchema>
```
