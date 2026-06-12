# Draft: cook.style.profile.schema.ts validator (gap — file does not exist)

Target: `shared/validator/cook.style/cook.style.profile.schema.ts`

---

```typescript
import { z } from '@brioela/shared/zod'
import { cookStyleAttributeTypeValues } from '@brioela/shared/constants/heirloom/cook.style.attribute.type.constant'

export const cookStyleAttributeSchema = z.object({
	id: z.string(),
	attributeType: z.enum(cookStyleAttributeTypeValues),
	description: z.string(),
	confidenceScore: z.number().min(0).max(1),
	sourceQuote: z.string().optional(),
})

export const cookStyleProfileSchema = z.object({
	id: z.string(),
	cookName: z.string(),
	cookRelationship: z.string().optional(),
	styleSummaryText: z.string(),
	sessionIds: z.array(z.string()),
	attributes: z.array(cookStyleAttributeSchema),
	coverPhotoRef: z.string().optional(),
	extractedAt: z.number(),
})

export const adaptRecipeToStyleInputSchema = z.object({
	recipeId: z.string(),
	profileId: z.string(),
})

export type CookStyleProfile = z.infer<typeof cookStyleProfileSchema>
export type AdaptRecipeToStyleInput = z.infer<typeof adaptRecipeToStyleInputSchema>
```
