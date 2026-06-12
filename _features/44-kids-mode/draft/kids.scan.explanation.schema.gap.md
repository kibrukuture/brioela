# Draft: kids.scan.explanation.schema.ts (gap — file does not exist)

Target: `shared/validator/kids.mode/kids.scan.explanation.schema.ts`

**Gap:** No shared Zod contract for kids explanation API + LLM JSON.

**Source:** `build-guide/21-kids-mode/02-scan-explanation.md`

---

```typescript
import { z } from 'zod'

export const kidsModeAgeRangeSchema = z.enum(['5-7', '8-10', '11-12'])
export type KidsModeAgeRange = z.infer<typeof kidsModeAgeRangeSchema>

export const kidsExplanationSafetyContextSchema = z.enum([
	'none',
	'allergy_warning',
	'low_confidence',
	'both',
])
export type KidsExplanationSafetyContext = z.infer<typeof kidsExplanationSafetyContextSchema>

export const kidsScanExplanationSchema = z.object({
	scanEventId: z.string().min(1),
	ageRange: kidsModeAgeRangeSchema,
	verdictSentence: z.string().min(1).max(280),
	whySentences: z.tuple([z.string().min(1).max(320), z.string().min(1).max(320)]),
	coolFact: z.string().min(1).max(320),
	sourceConfidence: z.number().min(0).max(1),
	safetyContext: kidsExplanationSafetyContextSchema,
})
export type KidsScanExplanation = z.infer<typeof kidsScanExplanationSchema>

export const generateKidsExplanationInputSchema = z.object({
	scanEventId: z.string().min(1),
	ageRange: kidsModeAgeRangeSchema.optional(),
})
export type GenerateKidsExplanationInput = z.infer<typeof generateKidsExplanationInputSchema>
```
