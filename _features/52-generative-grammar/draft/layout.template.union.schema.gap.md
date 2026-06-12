# Draft: compositions/index.ts (gap — file does not exist)

Target: `shared/grammar/schema/compositions/index.ts`

**Gap (feature 52):** Layout template discriminated union — vertical-slice starters.

**Source:** `11-composition-catalog-and-scale.md`, `12-naming-law.md`

---

```typescript
import { z } from '@brioela/shared/zod'

const scanExplanationFocusLayoutSchema = z.object({
	type: z.literal('scan_explanation_focus_layout'),
})

const mesaMemberFitGridLayoutSchema = z.object({
	type: z.literal('mesa_member_fit_grid_layout'),
})

const shareDiscoveryStampLayoutSchema = z.object({
	type: z.literal('share_discovery_stamp_layout'),
})

const passportInstructionFrameLayoutSchema = z.object({
	type: z.literal('passport_instruction_frame_layout'),
})

const harvestChapterStoryLayoutSchema = z.object({
	type: z.literal('harvest_chapter_story_layout'),
})

export const layoutTemplateSchema = z.discriminatedUnion('type', [
	scanExplanationFocusLayoutSchema,
	mesaMemberFitGridLayoutSchema,
	shareDiscoveryStampLayoutSchema,
	passportInstructionFrameLayoutSchema,
	harvestChapterStoryLayoutSchema,
])

export type LayoutTemplate = z.infer<typeof layoutTemplateSchema>

export const layoutTemplateTypeValues = layoutTemplateSchema.options.map(
	(option) => option.shape.type.value,
) as LayoutTemplate['type'][]
```
