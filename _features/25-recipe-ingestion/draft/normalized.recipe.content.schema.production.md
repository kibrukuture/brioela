# Production snapshot: normalized.recipe.content.schema.ts

Target: `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts`

**Owner:** **08** schema; **25** validates normalization output against this Zod shape.

```typescript
import { z } from '@brioela/shared/zod'
import {
	recipeReadViaSchema,
	recipeSharedFromSchema,
} from '@/agents/brain/_schemas/recipe.origin.schema'

const importedIngredientSchema = z.object({
	name: z.string().min(1),
	quantityText: z.string().nullable(),
	unit: z.string().nullable(),
	preparation: z.string().nullable(),
	optional: z.boolean(),
	estimated: z.boolean(),
	confidence: z.number().min(0).max(1),
})

const importedStepSchema = z.object({
	order: z.number().int().positive(),
	instruction: z.string().min(1),
	durationMinutes: z.number().nullable(),
	temperatureText: z.string().nullable(),
	confidence: z.number().min(0).max(1),
})

export const normalizedRecipeContentSchema = z.object({
	title: z.string().min(1),
	read_via: recipeReadViaSchema.optional(),
	link_url: z.string().nullable().optional(),
	shared_from: recipeSharedFromSchema.nullable().optional(),
	attribution: z.object({
		title: z.string().nullable(),
		authorName: z.string().nullable(),
		canonicalUrl: z.string().nullable(),
	}),
	servings: z.object({
		value: z.number().nullable(),
		confidence: z.number().min(0).max(1),
	}),
	totalTimeMinutes: z.object({
		value: z.number().nullable(),
		confidence: z.number().min(0).max(1),
	}),
	ingredients: z.array(importedIngredientSchema).min(1),
	steps: z.array(importedStepSchema).min(1),
	cuisine: z.string().nullable(),
	difficulty: z.enum(['easy', 'medium', 'hard', 'unknown']),
	tags: z.array(z.string()),
	confidence: z.number().min(0).max(1),
	warnings: z.array(z.string()),
})

export type NormalizedRecipeContent = z.infer<typeof normalizedRecipeContentSchema>

export function deriveIngredientNames(content: NormalizedRecipeContent): string[] {
	return content.ingredients.map((entry) => entry.name)
}
```
