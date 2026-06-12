# Draft: allowlists.ts (gap — file does not exist)

Target: `shared/grammar/catalog/allowlists.ts`

**Gap (feature 52):** Per-surface permitted `layoutTemplate.type` values.

**Source:** `02-grammar-document.md`, `06-surface-integration.md`, `13-how-ai-selects.md`

---

```typescript
import type { GenerativeSurface } from '../schema/surfaces'
import type { LayoutTemplate } from '../schema/compositions'

export const surfaceLayoutAllowlists: Record<
	GenerativeSurface,
	readonly LayoutTemplate['type'][]
> = {
	scan_explanation_brioela_generative_ui: [
		'scan_explanation_focus_layout',
	],
	recipe_card_brioela_generative_ui: [
		'recipe_steps_horizontal_layout',
		'recipe_technique_focus_layout',
	],
	cooking_opener_brioela_generative_ui: [
		'recipe_steps_horizontal_layout',
	],
	weekly_summary_brioela_generative_ui: [
		'summary_week_overview_layout',
	],
	food_time_machine_brioela_generative_ui: [
		'memory_recall_reflective_layout',
	],
	mesa_compatibility_brioela_generative_ui: [
		'mesa_member_fit_grid_layout',
		'mesa_conflict_focus_layout',
	],
	menu_scan_summary_brioela_generative_ui: [
		'scan_detail_insight_layout',
	],
	discovery_card_brioela_generative_ui: [
		'share_discovery_stamp_layout',
	],
	kids_learning_brioela_generative_ui: [
		'kids_explainer_gentle_layout',
	],
	savings_story_brioela_generative_ui: [
		'savings_story_scroll_layout',
	],
	passport_render_brioela_generative_ui: [
		'passport_instruction_frame_layout',
	],
	recipe_step_focus_brioela_generative_ui: [
		'recipe_technique_focus_layout',
	],
	harvest_chapter_brioela_generative_ui: [
		'harvest_chapter_story_layout',
	],
	harvest_cover_brioela_generative_ui: [
		'harvest_chapter_story_layout',
	],
	illness_detective_result_brioela_generative_ui: [
		'scan_explanation_focus_layout',
	],
	verified_creator_attribution_brioela_generative_ui: [
		'share_discovery_stamp_layout',
	],
}

export function isLayoutTemplateAllowedOnSurface(
	surface: GenerativeSurface,
	layoutType: LayoutTemplate['type'],
): boolean {
	return surfaceLayoutAllowlists[surface].includes(layoutType)
}
```
