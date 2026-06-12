# Draft: heritage.capture.schema.ts validator (gap — file does not exist)

Target: `shared/validator/heritage/heritage.capture.schema.ts`

---

```typescript
import { z } from '@brioela/shared/zod'
import { normalizedRecipeContentSchema } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'

export const heritageCaptureDraftSchema = z.object({
	captureId: z.string(),
	title: z.string(),
	ingredients: z.array(
		z.object({
			name: z.string(),
			quantity: z.string().optional(),
			confidence: z.enum(['certain', 'estimated', 'unknown']),
		}),
	),
	steps: z.array(
		z.object({
			instruction: z.string(),
			confidence: z.enum(['certain', 'estimated', 'unknown']),
		}),
	),
	sourceSessionRef: z.string(),
})

export const finalizeHeritageCaptureInputSchema = z.object({
	captureId: z.string(),
	acceptedDraft: heritageCaptureDraftSchema.optional(),
	recipeContent: normalizedRecipeContentSchema.optional(),
})

export type HeritageCaptureDraft = z.infer<typeof heritageCaptureDraftSchema>
export type FinalizeHeritageCaptureInput = z.infer<typeof finalizeHeritageCaptureInputSchema>
```
