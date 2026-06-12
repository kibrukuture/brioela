# Draft: surfaces.ts (gap — file does not exist)

Target: `shared/grammar/schema/surfaces.ts`

**Gap (feature 52):** Complete `GenerativeSurface` enum — baseline 10 + extension surfaces.

**Source:** `02-grammar-document.md`, `06-surface-integration.md`, `28-passport/07`, `36-harvest/03`

---

```typescript
import { z } from '@brioela/shared/zod'

/** Naming law: {feature}_{surface_role}_brioela_generative_ui */
export const generativeSurfaceValues = [
	// baseline (02-grammar-document.md)
	'scan_explanation_brioela_generative_ui',
	'recipe_card_brioela_generative_ui',
	'cooking_opener_brioela_generative_ui',
	'weekly_summary_brioela_generative_ui',
	'food_time_machine_brioela_generative_ui',
	'mesa_compatibility_brioela_generative_ui',
	'menu_scan_summary_brioela_generative_ui',
	'discovery_card_brioela_generative_ui',
	'kids_learning_brioela_generative_ui',
	'savings_story_brioela_generative_ui',
	// extensions (cross-feature — G3)
	'passport_render_brioela_generative_ui',
	'recipe_step_focus_brioela_generative_ui',
	'harvest_chapter_brioela_generative_ui',
	'harvest_cover_brioela_generative_ui',
	'illness_detective_result_brioela_generative_ui',
	'verified_creator_attribution_brioela_generative_ui',
] as const

export type GenerativeSurface = (typeof generativeSurfaceValues)[number]

export const generativeSurfaceSchema = z.enum(generativeSurfaceValues)
```
