# Draft: encore.schema.ts validator (gap — file does not exist)

Target: `shared/validator/encore/encore.schema.ts`

```typescript
import { z } from '@brioela/shared/zod'
import { normalizedRecipeContentSchema } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import { encoreStatusSchema } from '@brioela/shared/constants/encore/encore.status.constant'
import { encoreSourcingStatusSchema } from '@brioela/shared/constants/encore/encore.sourcing.status.constant'

export const encoreCaptureContextSchema = z.object({
	placeId: z.string().optional(),
	city: z.string().optional(),
	menuScanSessionId: z.string().optional(),
	mealPhotoIds: z.array(z.string()).optional(),
	capturedAt: z.number().int().nonnegative(),
})

export const encoreCaptureInputSchema = z.object({
	photoUploadIds: z.array(z.string()).min(1).max(6),
	voiceTranscript: z.string().max(2000).optional(),
	context: encoreCaptureContextSchema,
})

export const encoreSourcingItemSchema = z.object({
	ingredientName: z.string(),
	status: z.enum(encoreSourcingStatusSchema),
	nearestPlaceId: z.string().optional(),
	nearestFindId: z.string().optional(),
})

export const encoreOpenQuestionSchema = z.object({
	id: z.string(),
	component: z.string(),
	questionText: z.string(),
	resolved: z.boolean(),
})

export const encoreResponseSchema = z.object({
	encoreId: z.string(),
	status: z.enum(encoreStatusSchema),
	recipeId: z.string().optional(),
	draftRecipe: normalizedRecipeContentSchema.optional(),
	sourcing: z.array(encoreSourcingItemSchema).optional(),
	openQuestions: z.array(encoreOpenQuestionSchema).optional(),
	originCity: z.string().optional(),
	originPlaceId: z.string().optional(),
})

export type EncoreCaptureInput = z.infer<typeof encoreCaptureInputSchema>
export type EncoreResponse = z.infer<typeof encoreResponseSchema>
```
