# Gap snapshot: recipe.import.schema.ts

Target: `shared/validator/recipe.import.schema.ts`

**Status:** Not in repo. API + workflow contracts from `01-share-sheet-entry.md`, `02-import-job-workflow.md`, `08-shared-content-classifier.md`.

```typescript
import { z } from '@brioela/shared/zod'

export const recipeShareSourceTypeSchema = z.enum([
	'url',
	'video_url',
	'image',
	'native_media_reference',
	'place_url',
	'unknown',
])

export const recipeShareSourceAppSchema = z.enum([
	'tiktok',
	'youtube',
	'instagram',
	'browser',
	'unknown',
])

export const RecipeShareInputSchema = z.object({
	sourceType: recipeShareSourceTypeSchema,
	sourceUrl: z.string().url().nullable(),
	sourceApp: recipeShareSourceAppSchema.nullable(),
	titleHint: z.string().nullable(),
	previewText: z.string().nullable(),
	thumbnailUrl: z.string().url().nullable(),
	imageBase64: z.string().nullable(),
	sharedAt: z.number().int().nonnegative(),
})

export const CreateSharedImportResponseSchema = z.object({
	jobId: z.string().uuid(),
	status: z.literal('queued'),
	estimatedSeconds: z.number().int().positive().nullable(),
})

export const importJobStatusSchema = z.enum([
	'queued',
	'classifying',
	'extracting',
	'normalizing',
	'routing',
	'needs_review',
	'completed',
	'partial',
	'failed',
])

export const importJobRouteSchema = z.enum([
	'unknown',
	'recipe',
	'menu',
	'place',
	'product',
	'receipt',
	'memory_note',
])

export const SharedContentPrimaryKindSchema = z.enum([
	'recipe',
	'restaurant_menu',
	'place',
	'product',
	'receipt',
	'food_note',
	'shopping_list',
	'unknown_food',
	'non_food',
])

export const SharedContentRecommendedRouteSchema = z.enum([
	'recipe_import',
	'menu_scan',
	'map_place',
	'product_scan',
	'receipt_import',
	'memory_event',
	'needs_user_choice',
	'reject',
])

export const SharedContentClassificationSchema = z.object({
	jobId: z.string().uuid(),
	primaryKind: SharedContentPrimaryKindSchema,
	secondaryKinds: z.array(z.string()),
	confidence: z.number().min(0).max(1),
	reasons: z.array(z.string()),
	recommendedRoute: SharedContentRecommendedRouteSchema,
})

export const RecipeSourceArtifactsSchema = z.object({
	jobId: z.string().uuid(),
	sourceUrl: z.string().nullable(),
	canonicalUrl: z.string().nullable(),
	title: z.string().nullable(),
	authorName: z.string().nullable(),
	transcript: z.string().nullable(),
	captions: z.string().nullable(),
	extractedPageText: z.string().nullable(),
	extractedImageText: z.string().nullable(),
	thumbnailUrl: z.string().nullable(),
	mediaDurationSeconds: z.number().nullable(),
	extractionWarnings: z.array(z.string()),
})

export const RecipeImportStatusResponseSchema = z.object({
	jobId: z.string().uuid(),
	status: importJobStatusSchema,
	route: importJobRouteSchema,
	recipeId: z.string().uuid().nullable(),
	previewTitle: z.string().nullable(),
	thumbnailUrl: z.string().url().nullable(),
	warnings: z.array(z.string()),
	failureReason: z.string().nullable(),
})

export type RecipeShareInput = z.infer<typeof RecipeShareInputSchema>
export type SharedContentClassification = z.infer<typeof SharedContentClassificationSchema>
export type RecipeSourceArtifacts = z.infer<typeof RecipeSourceArtifactsSchema>
export type RecipeImportStatusResponse = z.infer<typeof RecipeImportStatusResponseSchema>
```
