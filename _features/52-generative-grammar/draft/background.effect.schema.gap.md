# Draft: background-effect.ts (gap — file does not exist)

Target: `shared/grammar/schema/tokens/background-effect.ts`

**Gap (feature 52):** Tier-2 background effect selection — tokens only, never raw SkSL.

**Source:** `04-emotion-motion-skia.md`, `16-atmosphere-skia-system.md`

---

```typescript
import { z } from '@brioela/shared/zod'
import { toneSchema, type ToneToken } from './tone'

export const backgroundEffectFamilyValues = [
	'none',
	'neutral_texture_background',
	'verdict_color_background',
	'memory_soft_glow_background',
	'mesa_group_background',
	'discovery_highlight_background',
] as const

export type BackgroundEffectToken = (typeof backgroundEffectFamilyValues)[number]

export const intensityTokenValues = [
	'none',
	'low',
	'medium',
	'high',
] as const

export type IntensityToken = (typeof intensityTokenValues)[number]

export const backgroundEffectSelectionSchema = z.object({
	family: z.enum(backgroundEffectFamilyValues),
	intensity: z.enum(intensityTokenValues),
	tone: toneSchema,
})

export type BackgroundEffectSelection = z.infer<typeof backgroundEffectSelectionSchema>

export const defaultBackgroundEffectForTone = (
	tone: ToneToken,
): BackgroundEffectSelection => ({
	family: 'neutral_texture_background',
	intensity: 'low',
	tone,
})
```
