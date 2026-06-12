# Gap snapshot: classify.shared.content.helper.ts

Target: `backend/src/api/recipes/_helpers/classify.shared.content.helper.ts`

**Status:** Not in repo. `08-shared-content-classifier.md`.

```typescript
import {
	SharedContentClassificationSchema,
	type RecipeShareInput,
	type SharedContentClassification,
} from '@brioela/shared/validator/recipe.import'

type ClassifyInput = {
	jobId: string
	shareInput: RecipeShareInput
	pageTextPreview: string | null
}

function inferFromUrl(url: string | null): SharedContentClassification['primaryKind'] | null {
	if (!url) return null
	const lower = url.toLowerCase()
	if (lower.includes('maps.google') || lower.includes('goo.gl/maps')) return 'place'
	if (lower.includes('menu') || lower.includes('/qr')) return 'restaurant_menu'
	return null
}

export function classifySharedContent(input: ClassifyInput): SharedContentClassification {
	const urlKind = inferFromUrl(input.shareInput.sourceUrl)
	const preview = `${input.shareInput.titleHint ?? ''} ${input.shareInput.previewText ?? ''} ${input.pageTextPreview ?? ''}`.toLowerCase()

	let primaryKind: SharedContentClassification['primaryKind'] = 'unknown_food'
	let recommendedRoute: SharedContentClassification['recommendedRoute'] = 'needs_user_choice'
	const reasons: string[] = []

	if (input.shareInput.sourceType === 'image') {
		primaryKind = 'recipe'
		recommendedRoute = 'recipe_import'
		reasons.push('image_share_defaults_to_recipe_extraction')
	} else if (urlKind === 'place') {
		primaryKind = 'place'
		recommendedRoute = 'map_place'
		reasons.push('url_matches_maps_pattern')
	} else if (urlKind === 'restaurant_menu') {
		primaryKind = 'restaurant_menu'
		recommendedRoute = 'menu_scan'
		reasons.push('url_matches_menu_pattern')
	} else if (preview.includes('ingredient') || preview.includes('cup ') || preview.includes('tbsp')) {
		primaryKind = 'recipe'
		recommendedRoute = 'recipe_import'
		reasons.push('preview_contains_recipe_language')
	} else if (input.shareInput.sourceType === 'video_url') {
		primaryKind = 'recipe'
		recommendedRoute = 'recipe_import'
		reasons.push('video_url_share')
	} else if (preview.trim().length === 0) {
		primaryKind = 'unknown_food'
		recommendedRoute = 'needs_user_choice'
		reasons.push('insufficient_metadata')
	}

	const confidence =
		recommendedRoute === 'needs_user_choice' ? 0.45 : recommendedRoute === 'reject' ? 0.9 : 0.72

	return SharedContentClassificationSchema.parse({
		jobId: input.jobId,
		primaryKind,
		secondaryKinds: [],
		confidence,
		reasons,
		recommendedRoute,
	})
}
```
